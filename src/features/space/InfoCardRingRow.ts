import * as THREE from 'three/src/Three.js';

import type {
  InformationSceneCategory,
  InformationSceneSubcategory,
} from '../information/models';
import { InfoCard3D } from './InfoCard3D';

// Constructor input for one row (one subcategory).
type InfoCardRingRowParams = {
  // Top-level category id (work, projects, etc).
  categoryId: InformationSceneCategory['id'];
  // Subcategory data and items for this row.
  subcategory: InformationSceneSubcategory;
  // Stable index used for mapping picks back to row/card ownership.
  ringIndex: number;
  // Radius from row center where cards are placed.
  rowRadius: number;
  // Vertical offset for this row relative to root card group.
  rowOffsetY: number;
};

const TWO_PI = Math.PI * 2;

// Owns one subcategory ring.
// Responsibilities:
// - Build cards from subcategory items.
// - Place cards around circular row.
// - Update row transform every frame.
// - Dispose card resources when row is removed.
export class InfoCardRingRow {
  // Group containing all cards for this row.
  readonly group = new THREE.Group();
  // Geometry settings for this row (used by manager and debug).
  readonly rowRadius: number;
  readonly rowOffsetY: number;

  // Cards owned by this row.
  private readonly cards: InfoCard3D[] = [];

  constructor(params: InfoCardRingRowParams) {
    this.rowRadius = params.rowRadius;
    this.rowOffsetY = params.rowOffsetY;

    const { categoryId, subcategory, ringIndex } = params;
    // Evenly distribute items around a circle using angle = i / n * 2PI.
    subcategory.items.forEach((item, itemIndex) => {
      const card = new InfoCard3D({
        categoryId,
        subcategoryId: subcategory.id,
        subcategoryLabel: subcategory.label,
        item,
        ringIndex,
        angle: subcategory.items.length <= 1 ? 0 : (itemIndex / subcategory.items.length) * TWO_PI,
      });

      // Place card once in local row-space. Runtime only updates row transform after this.
      card.setLocalRingPosition(this.rowRadius);
      this.group.add(card.mesh);
      this.cards.push(card);
    });
  }

  setPickIndices(startIndex: number): number {
    // Assign consecutive pick indexes so raycast can map directly to a card.
    let nextIndex = startIndex;
    for (const card of this.cards) {
      card.setPickIndex(nextIndex);
      nextIndex += 1;
    }
    return nextIndex;
  }

  appendCardsTo(target: InfoCard3D[]): void {
    // Share references with manager-level flat list for quick lookup/search.
    target.push(...this.cards);
  }

  update(spinPhase: number, cameraPosition: THREE.Vector3): void {
    // Position row at its fixed vertical lane.
    this.group.position.set(0, this.rowOffsetY, 0);
    // Apply tiny row yaw for ambient motion.
    this.group.rotation.y = spinPhase;

    // Billboard each card so text remains readable from camera.
    for (const card of this.cards) {
      card.face(cameraPosition);
    }
  }

  dispose(): void {
    // Row owns card meshes/materials/textures, so it must dispose them explicitly.
    for (const card of this.cards) {
      this.group.remove(card.mesh);
      card.dispose();
    }
  }
}
