import * as THREE from 'three/src/Three.js';

import type {
  InformationSceneCategory,
  InformationSceneSubcategory,
} from '../information/models';
import { InfoCard3D } from './InfoCard3D';

type InfoCardRingRowParams = {
  categoryId: InformationSceneCategory['id'];
  subcategory: InformationSceneSubcategory;
  ringIndex: number;
  rowRadius: number;
  rowOffsetY: number;
};

const TWO_PI = Math.PI * 2;

// Owns one subcategory ring: card creation, row transform, and ring-target facing.
export class InfoCardRingRow {
  readonly group = new THREE.Group();
  readonly rowRadius: number;
  readonly rowOffsetY: number;

  private readonly cards: InfoCard3D[] = [];
  private readonly lookTargetLocal: THREE.Vector3;
  private readonly lookTargetWorld = new THREE.Vector3();

  constructor(params: InfoCardRingRowParams) {
    this.rowRadius = params.rowRadius;
    this.rowOffsetY = params.rowOffsetY;
    this.lookTargetLocal = new THREE.Vector3(0, 0, this.rowRadius);

    const { categoryId, subcategory, ringIndex } = params;
    subcategory.items.forEach((item, itemIndex) => {
      const card = new InfoCard3D({
        categoryId,
        subcategoryId: subcategory.id,
        subcategoryLabel: subcategory.label,
        item,
        ringIndex,
        angle: subcategory.items.length <= 1 ? 0 : (itemIndex / subcategory.items.length) * TWO_PI,
      });

      card.setLocalRingPosition(this.rowRadius);
      this.group.add(card.mesh);
      this.cards.push(card);
    });
  }

  setPickIndices(startIndex: number): number {
    let nextIndex = startIndex;
    for (const card of this.cards) {
      card.setPickIndex(nextIndex);
      nextIndex += 1;
    }
    return nextIndex;
  }

  appendCardsTo(target: InfoCard3D[]): void {
    target.push(...this.cards);
  }

  update(spinPhase: number): void {
    this.group.position.set(0, this.rowOffsetY, 0);
    this.group.rotation.y = spinPhase;

    // "Forward" ring target: center -> +Z circumference intersection.
    this.lookTargetWorld.copy(this.lookTargetLocal);
    this.group.localToWorld(this.lookTargetWorld);

    for (const card of this.cards) {
      card.face(this.lookTargetWorld);
    }
  }

  dispose(): void {
    for (const card of this.cards) {
      this.group.remove(card.mesh);
      card.dispose();
    }
  }
}
