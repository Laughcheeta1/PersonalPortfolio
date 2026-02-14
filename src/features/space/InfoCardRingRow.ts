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
  // Visible arc span in radians, centered toward the camera side.
  arcSpan: number;
};

const HALF_PI = Math.PI * 0.5;
const CARD_CENTER_SPACING = 2.6;

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
  private arcSpan: number;

  constructor(params: InfoCardRingRowParams) {
    this.rowRadius = params.rowRadius;
    this.rowOffsetY = params.rowOffsetY;
    this.arcSpan = params.arcSpan;

    const { categoryId, subcategory, ringIndex } = params;
    // Evenly distribute items around a semicircle arc.
    subcategory.items.forEach((item, itemIndex) => {
      const angle = this.getCardAngle(itemIndex, subcategory.items.length);
      const card = new InfoCard3D({
        categoryId,
        subcategoryId: subcategory.id,
        subcategoryLabel: subcategory.label,
        item,
        ringIndex,
        angle,
      });

      // Place cards on a semicircle whose center is on the camera-side of this row.
      // Local +Z points toward camera side because parent group looks at camera.
      // Circle center: (0, 0, rowRadius)
      // Arc points: x = cos(a) * r, z = r - sin(a) * r, with a in [0, PI].
      const x = Math.cos(angle) * this.rowRadius;
      const z = this.rowRadius - Math.sin(angle) * this.rowRadius;
      card.mesh.position.set(x, 0, z);
      this.group.add(card.mesh);
      this.cards.push(card);
    });
  }

  setArcSpan(arcSpan: number): void {
    if (Math.abs(this.arcSpan - arcSpan) < 0.0001) {
      return;
    }

    this.arcSpan = arcSpan;
    this.layoutCards();
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

  private layoutCards(): void {
    const total = this.cards.length;
    for (let index = 0; index < total; index += 1) {
      const angle = this.getCardAngle(index, total);
      const x = Math.cos(angle) * this.rowRadius;
      const z = this.rowRadius - Math.sin(angle) * this.rowRadius;
      this.cards[index].mesh.position.set(x, 0, z);
    }
  }

  private getCardAngle(itemIndex: number, itemCount: number): number {
    if (itemCount <= 1) {
      return HALF_PI;
    }

    // Keep smaller sets near the center and only expand outward as needed.
    const desiredAngleGap = CARD_CENTER_SPACING / Math.max(this.rowRadius, 0.001);
    const desiredSpan = desiredAngleGap * (itemCount - 1);
    const effectiveSpan = Math.min(this.arcSpan, desiredSpan);

    const start = HALF_PI - effectiveSpan * 0.5;
    return start + (itemIndex / (itemCount - 1)) * effectiveSpan;
  }
}
