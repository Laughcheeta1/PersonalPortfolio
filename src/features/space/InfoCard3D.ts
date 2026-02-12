import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
  InformationSceneItem,
} from '../information/models';

type InfoCard3DParams = {
  categoryId: InformationSceneCategory['id'];
  subcategoryId: string;
  subcategoryLabel: string;
  item: InformationSceneItem;
  ringIndex: number;
  angle: number;
};

export class InfoCard3D {
  readonly mesh: THREE.Mesh;
  readonly categoryId: InformationSceneCategory['id'];
  readonly subcategoryId: string;
  readonly item: InformationSceneItem;
  readonly ringIndex: number;
  readonly angle: number;

  constructor(params: InfoCard3DParams) {
    this.categoryId = params.categoryId;
    this.subcategoryId = params.subcategoryId;
    this.item = params.item;
    this.ringIndex = params.ringIndex;
    this.angle = params.angle;

    const geometry = new THREE.BoxGeometry(2.2, 0.92, 0.5);
    const texture = this.createCardTexture(params.item.title, params.subcategoryLabel);
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

    this.mesh = new THREE.Mesh(geometry, [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      frontMaterial,
      backMaterial,
    ]);
    this.mesh.userData.infoCard = true;
  }

  setPickIndex(index: number): void {
    this.mesh.userData.infoCardIndex = index;
  }

  setLocalRingPosition(rowRadius: number): void {
    const x = Math.cos(this.angle) * rowRadius;
    const z = Math.sin(this.angle) * rowRadius;
    this.mesh.position.set(x, 0, z);
  }

  face(cameraPosition: THREE.Vector3): void {
    this.mesh.lookAt(cameraPosition);
  }

  toSelection(): InformationItemSelection {
    return {
      categoryId: this.categoryId,
      subcategoryId: this.subcategoryId,
      item: this.item,
    };
  }

  dispose(): void {
    const material = this.mesh.material;
    this.mesh.geometry.dispose();

    if (Array.isArray(material)) {
      for (const mat of material) {
        const mapCarrier = mat as THREE.MeshStandardMaterial;
        if (mapCarrier.map) {
          mapCarrier.map.dispose();
        }
        mat.dispose();
      }
      return;
    }

    const mapCarrier = material as THREE.MeshStandardMaterial;
    if (mapCarrier.map) {
      mapCarrier.map.dispose();
    }
    material.dispose();
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
