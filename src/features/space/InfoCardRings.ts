import * as THREE from 'three/src/Three.js';

import type {
  InformationSceneItem,
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
const FOCUSED_ORBIT_RADIUS = 7.4;
const SEMICIRCLE_RADIUS_MULTIPLIER = 2;
const MAX_SEMICIRCLE_SPAN = Math.PI;
const VISIBLE_ARC_FRACTION = 0.92;
const MIN_VISIBLE_ARC_SPAN = 1.0;
const MIN_CARD_CENTER_SPACING = 2.6;
const OVERFLOW_RING_RADIUS_STEP = 1.8;

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
  private activeCategory: InformationSceneCategory | null = null;
  // We use this once after rebuild so cards spawn behind camera first.
  private introPending = false;
  // Current world-orbit angle for this full card system.
  private ringAngle = 0;
  private currentArcSpan = MAX_SEMICIRCLE_SPAN;

  // Reused vectors prevent extra allocations every frame.
  private readonly cameraForward = new THREE.Vector3();
  private readonly centerToCamera = new THREE.Vector3();
  // Vertical lift applied to the whole card system relative to its anchor.
  private readonly anchorOffset = new THREE.Vector3(0, 0.96, 0);

  rebuild(category: InformationSceneCategory | null, arcSpan = this.currentArcSpan): void {
    // Rebuild from scratch whenever selected category changes.
    // This keeps state simple and avoids subtle diff-update bugs.
    this.clear();
    this.activeCategory = category;

    // If nothing is selected (or category has no rows), there is nothing to draw.
    if (!category || category.subcategories.length === 0) {
      return;
    }

    // Vertical distance between generated rings.
    const rowSpacing = 1.35;
    // Base semicircle radius (primary ring per subcategory).
    const baseRadius = FOCUSED_ORBIT_RADIUS * SEMICIRCLE_RADIUS_MULTIPLIER;
    // Global pick index across all cards.
    let pickIndex = 0;
    this.currentArcSpan = arcSpan;

    const rowPlans: Array<{
      categoryId: InformationSceneCategory['id'];
      subcategoryId: string;
      subcategoryLabel: string;
      items: InformationSceneItem[];
      rowRadius: number;
    }> = [];

    category.subcategories.forEach((subcategory) => {
      // Skip empty rows.
      if (subcategory.items.length === 0) {
        return;
      }

      // Split large subcategories into multiple rings when one ring would cause overlap.
      // Each additional ring for the same subcategory increases radius.
      let cursor = 0;
      let overflowRing = 0;
      while (cursor < subcategory.items.length) {
        const rowRadius = baseRadius + overflowRing * OVERFLOW_RING_RADIUS_STEP;
        const maxCardsInRing = Math.max(
          1,
          Math.floor((this.currentArcSpan * rowRadius) / MIN_CARD_CENTER_SPACING) + 1,
        );
        const nextCursor = Math.min(cursor + maxCardsInRing, subcategory.items.length);

        rowPlans.push({
          categoryId: category.id,
          subcategoryId: subcategory.id,
          subcategoryLabel: subcategory.label,
          items: subcategory.items.slice(cursor, nextCursor),
          rowRadius,
        });

        cursor = nextCursor;
        overflowRing += 1;
      }
    });

    const totalRows = rowPlans.length;
    rowPlans.forEach((plan, rowIndex) => {
      // Centers all generated rows vertically around y=0.
      const rowOffsetY = ((totalRows - 1) / 2 - rowIndex) * rowSpacing;
      const row = new InfoCardRingRow({
        categoryId: plan.categoryId,
        subcategory: {
          id: plan.subcategoryId,
          label: plan.subcategoryLabel,
          items: plan.items,
        },
        ringIndex: this.infoRows.length,
        rowRadius: plan.rowRadius,
        rowOffsetY,
        arcSpan: this.currentArcSpan,
      });

      pickIndex = row.setPickIndices(pickIndex);
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
    this.activeCategory = null;
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
      const visibleArcSpan = this.computeVisibleArcSpan(camera);
      if (Math.abs(visibleArcSpan - this.currentArcSpan) > 0.02) {
        if (this.activeCategory) {
          // Reflow rows so overflow-splitting is recalculated for new visible span.
          this.rebuild(this.activeCategory, visibleArcSpan);
        } else {
          this.currentArcSpan = visibleArcSpan;
          for (const row of this.infoRows) {
            row.setArcSpan(this.currentArcSpan);
          }
        }
      }

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

    // Keep arc container oriented toward camera side.
    this.group.lookAt(camera.position);

    for (const row of this.infoRows) {
      // Row update applies local lane transform and camera-facing card orientation.
      row.update(camera.position);
    }
  }

  private computeVisibleArcSpan(camera: THREE.PerspectiveCamera): number {
    const verticalFovRad = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFovRad = 2 * Math.atan(Math.tan(verticalFovRad * 0.5) * camera.aspect);
    const usable = horizontalFovRad * VISIBLE_ARC_FRACTION;
    return THREE.MathUtils.clamp(usable, MIN_VISIBLE_ARC_SPAN, MAX_SEMICIRCLE_SPAN);
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
