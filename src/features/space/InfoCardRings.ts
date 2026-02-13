import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
} from '../information/models';
import { InfoCard3D } from './InfoCard3D';
import { InfoCardRingRow } from './InfoCardRingRow';
import { wrapToPi } from './math';

// Data passed from the runtime when a model is focused.
// Think of this as "the circle the camera is orbiting right now".
type FocusOrbitCircle = {
  // World position of the selected model. This is the center of the orbit.
  center: THREE.Vector3;
  // Orbit radius used by the camera around the selected model.
  radius: number;
  // Vertical offset of the camera orbit above model center.
  orbitHeight: number;
};

// Controls how quickly ring angle catches up to the desired opposite angle.
const RING_CHASE_SPEED = 3.2;
// Ring radius is a multiple of the camera orbit radius.
const RING_RADIUS_MULTIPLIER = 1.5;

// Manages all 3D card rows for the currently selected category.
// - Rebuilds rows when category changes.
// - Updates ring position/rotation every frame.
// - Maps raycast hits back to data items.
export class InfoCardRings {
  // Root Three.js group for every row. Runtime adds this once to the scene.
  readonly group = new THREE.Group();

  // Flat list of every card for easy hit lookup by index.
  private infoCards: InfoCard3D[] = [];
  // One row per subcategory.
  private infoRows: InfoCardRingRow[] = [];
  // Tiny spin value shared by all rows (visual movement).
  private spinPhase = 0;
  // We use this once after rebuild so cards spawn behind camera first.
  private introPending = false;
  // Current world-orbit angle for this full card system.
  private ringAngle = 0;

  // Reused vectors prevent extra allocations every frame.
  private readonly cameraForward = new THREE.Vector3();
  private readonly centerToCamera = new THREE.Vector3();
  // Vertical lift applied to the whole card system relative to its anchor.
  private readonly anchorOffset = new THREE.Vector3(0, 1.2, 0);

  rebuild(category: InformationSceneCategory | null): void {
    // Rebuild from scratch whenever selected category changes.
    // This keeps state simple and avoids subtle diff-update bugs.
    this.clear();

    // If nothing is selected (or category has no rows), there is nothing to draw.
    if (!category || category.subcategories.length === 0) {
      return;
    }

    // Vertical distance between subcategory rows.
    const rowSpacing = 1.35;
    // Base ring radius for first row.
    const minRadius = 2.5;
    // Global pick index across all cards.
    let pickIndex = 0;

    category.subcategories.forEach((subcategory, rowIndex) => {
      // Skip empty rows.
      if (subcategory.items.length === 0) {
        return;
      }

      // Row radius grows for each row so rings are nested.
      const rowRadius = minRadius + rowIndex * 1.4;
      // Centers all rows vertically around y=0.
      const rowOffsetY = ((category.subcategories.length - 1) / 2 - rowIndex) * rowSpacing;

      // Create one row object that will own all cards for this subcategory.
      const row = new InfoCardRingRow({
        categoryId: category.id,
        subcategory,
        ringIndex: this.infoRows.length,
        rowRadius,
        rowOffsetY,
      });

      // Assign contiguous pick ids so raycast can recover exact card.
      pickIndex = row.setPickIndices(pickIndex);
      // Keep flat references for quick target/pick lookup.
      row.appendCardsTo(this.infoCards);
      this.infoRows.push(row);
      this.group.add(row.group);
    });

    // Next update should spawn rows from camera angle once, then chase opposite.
    this.introPending = this.infoCards.length > 0;
    this.ringAngle = 0;
  }

  clear(): void {
    // Dispose GPU resources and detach row groups from root group.
    for (const row of this.infoRows) {
      row.dispose();
      this.group.remove(row.group);
    }

    this.infoCards = [];
    this.infoRows = [];
    this.spinPhase = 0;
    this.introPending = false;
    this.ringAngle = 0;
  }

  dispose(): void {
    // Public dispose for runtime cleanup.
    this.clear();
  }

  update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    active: boolean,
    focusOrbit?: FocusOrbitCircle,
  ): void {
    // If nothing is focused, or no cards exist, skip work.
    if (!active || this.infoCards.length === 0) {
      return;
    }

    if (focusOrbit) {
      // Compute camera angle around selected model center.
      // atan2(x, z) returns angle around vertical axis in this coordinate setup.
      this.centerToCamera.subVectors(camera.position, focusOrbit.center);
      const cameraAngle = Math.atan2(this.centerToCamera.x, this.centerToCamera.z);
      // Cards should stay opposite to camera on same orbit.
      const oppositeAngle = cameraAngle + Math.PI;

      if (this.introPending) {
        this.introPending = false;
        // First frame after rebuild: spawn at camera angle (behind camera),
        // then naturally move toward opposite angle.
        this.ringAngle = cameraAngle;
      }

      // Smoothly chase opposite angle. wrapToPi avoids long-way rotation jumps.
      const delta = wrapToPi(oppositeAngle - this.ringAngle);
      const chaseFactor = Math.min(1, dt * RING_CHASE_SPEED);
      this.ringAngle += delta * chaseFactor;
      const ringAngle = this.ringAngle;

      // Subtle row spin to avoid fully static look.
      this.spinPhase += dt * 0.0001;

      // Position whole card system on a larger ring around same center.
      const ringRadius = Math.max(0.1, focusOrbit.radius * RING_RADIUS_MULTIPLIER);
      this.group.position.set(
        focusOrbit.center.x + Math.sin(ringAngle) * ringRadius,
        focusOrbit.center.y + focusOrbit.orbitHeight * 0.5,
        focusOrbit.center.z + Math.cos(ringAngle) * ringRadius,
      );
      this.group.position.add(this.anchorOffset);
    } else {
      // Fallback path if focus circle is unavailable.
      // Places cards in front of camera so they still remain visible.
      camera.getWorldDirection(this.cameraForward);
      this.group.position
        .copy(camera.position)
        .addScaledVector(this.cameraForward, 10)
        .add(this.anchorOffset);
    }

    // Orient full row-system toward camera.
    this.group.lookAt(camera.position);

    for (const row of this.infoRows) {
      // Row update handles:
      // 1) local row transform,
      // 2) card billboarding toward camera.
      row.update(this.spinPhase, camera.position);
    }
  }

  getSelectionByObject(object: THREE.Object3D): InformationItemSelection | null {
    // Raycasts can hit a child mesh, so walk up parents until we hit infoCard marker.
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.infoCard === true) {
        // infoCardIndex maps back into infoCards[] flat array.
        const index = current.userData.infoCardIndex as number;
        const card = this.infoCards[index];
        if (!card) {
          return null;
        }

        return card.toSelection();
      }

      current = current.parent;
    }

    return null;
  }

  findSelectionByTarget(
    itemId: string,
    subcategoryId?: string,
  ): InformationItemSelection | null {
    // Supports both stable internal id and friendly slug.
    // Optional subcategory narrows lookup when ids could overlap across rows.
    const card = this.infoCards.find((entry) => {
      const itemMatches = entry.item.id === itemId || entry.item.slug === itemId;
      const subcategoryMatches =
        subcategoryId === undefined || subcategoryId === entry.subcategoryId;
      return itemMatches && subcategoryMatches;
    });

    if (!card) {
      return null;
    }

    return card.toSelection();
  }
}
