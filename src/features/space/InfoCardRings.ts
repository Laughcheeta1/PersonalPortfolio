import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
} from '../information/models';
import { InfoCard3D } from './InfoCard3D';
import { InfoCardRingRow } from './InfoCardRingRow';
import { wrapToPi } from './math';

type FocusOrbitCircle = {
  center: THREE.Vector3;
  radius: number;
  orbitHeight: number;
};

const RING_CHASE_SPEED = 3.2;

// Manages all mini-card rings for the currently focused category.
export class InfoCardRings {
  readonly group = new THREE.Group();

  private infoCards: InfoCard3D[] = [];
  private infoRows: InfoCardRingRow[] = [];
  private spinPhase = 0;
  private introPending = false;
  private ringAngle = 0;

  private readonly cameraForward = new THREE.Vector3();
  private readonly centerToCamera = new THREE.Vector3();
  // Vertical lift applied to the whole card system relative to the orbit anchor.
  private readonly anchorOffset = new THREE.Vector3(0, 1.2, 0);

  rebuild(category: InformationSceneCategory | null): void {
    // Full rebuild is simpler and safer than incremental patching when category changes.
    this.clear();

    if (!category || category.subcategories.length === 0) {
      return;
    }

    const rowSpacing = 1.35;
    const minRadius = 2.5;
    let pickIndex = 0;

    category.subcategories.forEach((subcategory, rowIndex) => {
      if (subcategory.items.length === 0) {
        return;
      }

      const rowRadius = minRadius + rowIndex * 1.4;
      const rowOffsetY = ((category.subcategories.length - 1) / 2 - rowIndex) * rowSpacing;
      const row = new InfoCardRingRow({
        categoryId: category.id,
        subcategory,
        ringIndex: this.infoRows.length,
        rowRadius,
        rowOffsetY,
      });

      pickIndex = row.setPickIndices(pickIndex);
      row.appendCardsTo(this.infoCards);
    this.infoRows.push(row);
    this.group.add(row.group);
  });

  this.introPending = this.infoCards.length > 0;
  this.ringAngle = 0;
}

  clear(): void {
    // Dispose card GPU resources first, then remove groups.
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
    this.clear();
  }

  update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    active: boolean,
    focusOrbit?: FocusOrbitCircle,
  ): void {
    if (!active || this.infoCards.length === 0) {
      return;
    }

    if (focusOrbit) {
      // Measure camera angle from the focused model center to avoid drift while camera lerps.
      this.centerToCamera.subVectors(camera.position, focusOrbit.center);
      const cameraAngle = Math.atan2(this.centerToCamera.x, this.centerToCamera.z);
      const oppositeAngle = cameraAngle + Math.PI;

      if (this.introPending) {
        this.introPending = false;
        // Spawn at camera angle (behind the camera on this orbit), then start chasing opposite.
        this.ringAngle = cameraAngle;
      }

      const delta = wrapToPi(oppositeAngle - this.ringAngle);
      const chaseFactor = Math.min(1, dt * RING_CHASE_SPEED);
      this.ringAngle += delta * chaseFactor;
      const ringAngle = this.ringAngle;

      this.spinPhase += dt * 0.0001;

      // Keep cards on the same orbit center/angle, but at double the camera orbit radius.
      const ringRadius = Math.max(0.1, focusOrbit.radius * 2);
      this.group.position.set(
        focusOrbit.center.x + Math.sin(ringAngle) * ringRadius,
        focusOrbit.center.y + focusOrbit.orbitHeight * 0.5,
        focusOrbit.center.z + Math.cos(ringAngle) * ringRadius,
      );
      this.group.position.add(this.anchorOffset);
    } else {
      // Fallback anchor in front of camera when focus-circle data is unavailable.
      camera.getWorldDirection(this.cameraForward);
      this.group.position
        .copy(camera.position)
        .addScaledVector(this.cameraForward, 10)
        .add(this.anchorOffset);
    }

    this.group.lookAt(camera.position);

    for (const row of this.infoRows) {
      // Row-level update rotates the ring while cards keep facing the camera.
      row.update(this.spinPhase, camera.position);
    }
  }

  getSelectionByObject(object: THREE.Object3D): InformationItemSelection | null {
    // Walk parent chain to support ray hits on nested mesh parts.
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.infoCard === true) {
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
    // Supports both stable ids and human-friendly slugs.
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
