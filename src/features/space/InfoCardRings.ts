import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
  InformationSceneItem,
} from '../information/models';

type InfoCardMesh = {
  mesh: THREE.Mesh;
  categoryId: InformationSceneCategory['id'];
  subcategoryId: string;
  item: InformationSceneItem;
  ringIndex: number;
  angle: number;
};

type InfoRing = {
  group: THREE.Group;
  rowRadius: number;
  rowOffsetY: number;
};

const TWO_PI = Math.PI * 2;

export class InfoCardRings {
  readonly group = new THREE.Group();

  private infoCards: InfoCardMesh[] = [];
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
        const geometry = new THREE.BoxGeometry(2.2, 0.92, 0.09);
        const texture = this.createCardTexture(item.title, subcategory.label);
        const frontMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          opacity: 0.96,
          roughness: 0.38,
          metalness: 0.08,
        });
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: '#102139',
          roughness: 0.55,
          metalness: 0.15,
        });
        const backMaterial = new THREE.MeshStandardMaterial({
          color: '#0a162a',
          roughness: 0.6,
          metalness: 0.05,
        });

        const mesh = new THREE.Mesh(geometry, [
          sideMaterial,
          sideMaterial,
          sideMaterial,
          sideMaterial,
          frontMaterial,
          backMaterial,
        ]);

        mesh.userData.infoCard = true;
        mesh.userData.infoCardIndex = this.infoCards.length;

        ringGroup.add(mesh);
        this.infoCards.push({
          mesh,
          categoryId: category.id,
          subcategoryId: subcategory.id,
          item,
          ringIndex,
          angle: subcategory.items.length <= 1 ? 0 : (itemIndex / subcategory.items.length) * TWO_PI,
        });
      });
    });
  }

  clear(): void {
    for (const card of this.infoCards) {
      const material = card.mesh.material;
      card.mesh.geometry.dispose();
      if (Array.isArray(material)) {
        for (const mat of material) {
          const mapCarrier = mat as THREE.MeshStandardMaterial;
          if (mapCarrier.map) {
            mapCarrier.map.dispose();
          }
          mat.dispose();
        }
      } else {
        const mapCarrier = material as THREE.MeshStandardMaterial;
        if (mapCarrier.map) {
          mapCarrier.map.dispose();
        }
        material.dispose();
      }

      const ring = this.infoRings[card.ringIndex];
      if (ring) {
        ring.group.remove(card.mesh);
      } else {
        this.group.remove(card.mesh);
      }
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

      const x = Math.cos(card.angle) * ring.rowRadius;
      const z = Math.sin(card.angle) * ring.rowRadius;
      card.mesh.position.set(x, 0, z);
      card.mesh.lookAt(camera.position);
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

        return {
          categoryId: card.categoryId,
          subcategoryId: card.subcategoryId,
          item: card.item,
        };
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

    return {
      categoryId: card.categoryId,
      subcategoryId: card.subcategoryId,
      item: card.item,
    };
  }

  private createCardTexture(title: string, subtitle: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(9, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(126, 209, 255, 0.95)';
    ctx.lineWidth = 6;

    const padding = 22;
    const radius = 26;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    ctx.beginPath();
    ctx.moveTo(padding + radius, padding);
    ctx.lineTo(padding + width - radius, padding);
    ctx.quadraticCurveTo(padding + width, padding, padding + width, padding + radius);
    ctx.lineTo(padding + width, padding + height - radius);
    ctx.quadraticCurveTo(padding + width, padding + height, padding + width - radius, padding + height);
    ctx.lineTo(padding + radius, padding + height);
    ctx.quadraticCurveTo(padding, padding + height, padding, padding + height - radius);
    ctx.lineTo(padding, padding + radius);
    ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#96d7ff';
    ctx.font = '600 46px Inter, sans-serif';
    ctx.fillText(subtitle, 64, 120);

    ctx.fillStyle = '#eaf7ff';
    ctx.font = '700 64px Inter, sans-serif';
    ctx.fillText(title, 64, 220);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
