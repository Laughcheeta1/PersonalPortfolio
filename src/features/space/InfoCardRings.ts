import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
} from '../information/models';
import { InfoCard3D } from './InfoCard3D';

type InfoRing = {
  group: THREE.Group;
  rowRadius: number;
  rowOffsetY: number;
};

const TWO_PI = Math.PI * 2;

export class InfoCardRings {
  readonly group = new THREE.Group();

  private infoCards: InfoCard3D[] = [];
  private infoRings: InfoRing[] = [];
  private spinPhase = 0;

  private readonly cameraForward = new THREE.Vector3();
  private readonly anchorOffset = new THREE.Vector3(0, 1.2, 0);

  rebuild(category: InformationSceneCategory | null): void {
    this.clear();

    if (!category || category.subcategories.length === 0) {
      return;
    }

    const rowSpacing = 1.35;
    const minRadius = 2.5;

    category.subcategories.forEach((subcategory, rowIndex) => {
      if (subcategory.items.length === 0) {
        return;
      }

      const ringGroup = new THREE.Group();
      const rowRadius = minRadius + rowIndex * 1.4;
      const rowOffsetY = ((category.subcategories.length - 1) / 2 - rowIndex) * rowSpacing;
      this.group.add(ringGroup);

      const ringIndex = this.infoRings.length;
      this.infoRings.push({
        group: ringGroup,
        rowRadius,
        rowOffsetY,
      });

      subcategory.items.forEach((item, itemIndex) => {
        const card = new InfoCard3D({
          categoryId: category.id,
          subcategoryId: subcategory.id,
          subcategoryLabel: subcategory.label,
          item,
          ringIndex,
          angle: subcategory.items.length <= 1 ? 0 : (itemIndex / subcategory.items.length) * TWO_PI,
        });

        card.setPickIndex(this.infoCards.length);
        ringGroup.add(card.mesh);
        this.infoCards.push(card);
      });
    });
  }

  clear(): void {
    for (const card of this.infoCards) {
      const ring = this.infoRings[card.ringIndex];
      if (ring) {
        ring.group.remove(card.mesh);
      } else {
        this.group.remove(card.mesh);
      }
      card.dispose();
    }

    for (const ring of this.infoRings) {
      this.group.remove(ring.group);
    }

    this.infoCards = [];
    this.infoRings = [];
    this.spinPhase = 0;
  }

  dispose(): void {
    this.clear();
  }

  update(dt: number, camera: THREE.PerspectiveCamera, active: boolean): void {
    if (!active || this.infoCards.length === 0) {
      return;
    }

    this.spinPhase += dt * 2.0;

    camera.getWorldDirection(this.cameraForward);
    this.group.position
      .copy(camera.position)
      .addScaledVector(this.cameraForward, -10)
      .add(this.anchorOffset);
    this.group.lookAt(camera.position);

    for (const ring of this.infoRings) {
      ring.group.position.set(0, ring.rowOffsetY, 0);
      ring.group.rotation.y = this.spinPhase;
    }

    for (const card of this.infoCards) {
      const ring = this.infoRings[card.ringIndex];
      if (!ring) {
        continue;
      }

      card.setLocalRingPosition(ring.rowRadius);
      card.face(camera.position);
    }
  }

  getSelectionByObject(object: THREE.Object3D): InformationItemSelection | null {
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
