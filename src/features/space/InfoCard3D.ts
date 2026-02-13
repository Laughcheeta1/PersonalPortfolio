import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
  InformationSceneItem,
} from '../information/models';

// Required data for creating one visible 3D card.
type InfoCard3DParams = {
  // Category id (e.g. "work").
  categoryId: InformationSceneCategory['id'];
  // Subcategory id (e.g. "companies").
  subcategoryId: string;
  // Human-readable subcategory text rendered on card texture.
  subcategoryLabel: string;
  // Scene item whose title/summary/details the card represents.
  item: InformationSceneItem;
  // Parent row index. Useful for manager bookkeeping.
  ringIndex: number;
  // Angular position around the row ring in radians.
  angle: number;
};

// Represents one physical 3D info card:
// - Mesh and materials
// - Metadata for selection
// - Texture generation
// - Disposal helpers for GPU resources
export class InfoCard3D {
  // The actual renderable object added to a Three.js group.
  readonly mesh: THREE.Mesh;
  // Metadata used when selecting/opening details in UI.
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

    // Build a small box so card has thickness (not a flat plane).
    // Width=2.2, Height=0.92, Depth=0.5 in scene units.
    const geometry = new THREE.BoxGeometry(2.2, 0.92, 0.5);

    // Generate texture in canvas at runtime.
    // This lets us render item title text without external image assets.
    const texture = this.createCardTexture(params.item.title, params.subcategoryLabel);

    // Front face material uses generated texture.
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.96,
      roughness: 0.38,
      metalness: 0.08,
    });

    // Side and back are plain materials for depth and contrast.
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

    // BoxGeometry with 6 materials: +x, -x, +y, -y, +z(front), -z(back).
    this.mesh = new THREE.Mesh(geometry, [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      frontMaterial,
      backMaterial,
    ]);

    // Mark mesh so raycast system can identify this as an info-card hit.
    this.mesh.userData.infoCard = true;
  }

  setPickIndex(index: number): void {
    // Raycast returns a mesh; we store index so manager can resolve to InfoCard3D quickly.
    this.mesh.userData.infoCardIndex = index;
  }

  setLocalRingPosition(rowRadius: number): void {
    // Convert polar coordinate (radius + angle) to XZ Cartesian.
    // Cards are positioned in row-local space.
    const x = Math.cos(this.angle) * rowRadius;
    const z = Math.sin(this.angle) * rowRadius;
    this.mesh.position.set(x, 0, z);
  }

  face(cameraPosition: THREE.Vector3): void {
    // Rotate card so +Z face points toward camera position (billboarding).
    this.mesh.lookAt(cameraPosition);
  }

  toSelection(): InformationItemSelection {
    // Convert card metadata to shared payload shape used by React details panel.
    return {
      categoryId: this.categoryId,
      subcategoryId: this.subcategoryId,
      item: this.item,
    };
  }

  dispose(): void {
    // Three.js does not auto-free GPU resources.
    // We must dispose geometry, materials, and textures explicitly.
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
    // Use offscreen canvas to paint title/subtitle into a texture.
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Extremely rare fallback when 2D context cannot be created.
      return new THREE.CanvasTexture(canvas);
    }

    // Clear previous content and draw rounded background panel.
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

    // Subtitle (subcategory label).
    ctx.fillStyle = '#96d7ff';
    ctx.font = '600 46px Inter, sans-serif';
    ctx.fillText(subtitle, 64, 120);

    // Main title (item title).
    ctx.fillStyle = '#eaf7ff';
    ctx.font = '700 64px Inter, sans-serif';
    ctx.fillText(title, 64, 220);

    // Convert canvas into GPU texture.
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    // Use sRGB so colors match CSS/expected UI color space.
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
