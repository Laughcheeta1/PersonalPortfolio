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

const ARC_SPAN = Math.PI;
const ARC_START_ANGLE = 0;

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
    // Evenly distribute items around a semicircle arc.
    subcategory.items.forEach((item, itemIndex) => {
      const itemCount = subcategory.items.length;
      const angle =
        itemCount <= 1
          ? ARC_START_ANGLE + ARC_SPAN * 0.5
          : ARC_START_ANGLE + (itemIndex / (itemCount - 1)) * ARC_SPAN;
      const card = new InfoCard3D({
        categoryId,
        subcategoryId: subcategory.id,
        subcategoryLabel: subcategory.label,
        item,
        ringIndex,
        angle,
      });

      // Place and orient once in row-local space.
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

  update(cameraPosition: THREE.Vector3): void {
    // Position row at its fixed vertical lane.
    this.group.position.set(0, this.rowOffsetY, 0);

    // Orient cards toward camera-side center.
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
