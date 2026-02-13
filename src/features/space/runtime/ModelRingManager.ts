import * as THREE from 'three/src/Three.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import type { SpaceModelItem } from '../spaceModels';
import type { FocusTarget, LoadedModel } from './types';
import { wrapToPi } from '../math';

const TWO_PI = Math.PI * 2;

// Handles loading, layout, highlight, and disposal of the ring of 3D models.
export class ModelRingManager {
  // Root group containing every model holder.
  readonly group = new THREE.Group();

  // Layout and sizing config.
  private readonly ringRadius: number;
  private readonly targetModelSize: number;
  // Angle between neighboring model slots in ring.
  private readonly angleStep: number;
  // GLTF loader reused for all assets.
  private readonly loader = new GLTFLoader();
  // Cache of loaded models for fast highlight and focus computations.
  private readonly loadedModels: LoadedModel[] = [];

  constructor(modelCount: number, ringRadius: number, targetModelSize: number) {
    this.ringRadius = ringRadius;
    this.targetModelSize = targetModelSize;
    this.angleStep = TWO_PI / modelCount;
  }

  // Loads and positions all models in the circular ring.
  // `isDisposed` lets runtime abort cleanly if user navigates away mid-load.
  async load(models: SpaceModelItem[], isDisposed: () => boolean): Promise<void> {
    for (let index = 0; index < models.length; index += 1) {
      const gltf = await this.loader.loadAsync(models[index].url);
      if (isDisposed()) {
        // Runtime already torn down; avoid attaching more scene objects.
        return;
      }

      // Holder is the transform root for this model.
      // We rotate/place holder in ring instead of touching each child mesh.
      const holder = new THREE.Group();
      holder.userData.modelIndex = index;

      const root = gltf.scene;
      this.normalizeModelSize(root);

      // Collect all mesh nodes once for efficient highlight updates.
      const meshes: THREE.Mesh[] = [];
      root.traverse((node: THREE.Object3D) => {
        if (!(node instanceof THREE.Mesh)) {
          return;
        }

        // Shadows are disabled in this scene profile for performance/clarity.
        node.castShadow = false;
        node.receiveShadow = false;
        // Mesh marker enables click->model mapping via parent traversal.
        node.userData.modelIndex = index;
        meshes.push(node);
      });

      // Place model holder on ring using polar -> Cartesian conversion.
      const angle = index * this.angleStep;
      holder.position.set(Math.cos(angle) * this.ringRadius, 0, Math.sin(angle) * this.ringRadius);
      holder.lookAt(0, 0, 0);

      // Attach loaded root and register in scene/cache.
      holder.add(root);
      this.group.add(holder);
      this.loadedModels.push({ holder, meshes });
    }
  }

  // Guard helper used by runtime when setting selection.
  isValidIndex(index: number): boolean {
    return index >= 0 && index < this.loadedModels.length;
  }

  // Applies emissive highlight to selected model and updates bloom strength.
  highlightSelection(selectedIndex: number | null, bloomPass: UnrealBloomPass): void {
    for (let index = 0; index < this.loadedModels.length; index += 1) {
      const model = this.loadedModels[index];
      const active = index === selectedIndex;

      for (const mesh of model.meshes) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          if (!('emissive' in material)) {
            continue;
          }

          const mat = material as THREE.MeshStandardMaterial;
          mat.emissive.set(active ? '#4fd9ff' : '#000000');
          mat.emissiveIntensity = active ? 0.45 : 0;
        }
      }
    }

    bloomPass.strength = selectedIndex === null ? 0.22 : 0.34;
  }

  // Returns focused-camera orbit parameters for currently selected model.
  getFocusTarget(selectedIndex: number | null): FocusTarget | null {
    if (selectedIndex === null) {
      return null;
    }

    const model = this.loadedModels[selectedIndex];
    if (!model) {
      return null;
    }

    return {
      position: model.holder.position.clone(),
      orbitRadius: 7.4,
      orbitHeight: 2.7,
    };
  }

  // Finds which model slot is closest to current camera orbit angle.
  // Used by Enter key to "focus nearest".
  getNearestModelIndex(orbitAngle: number): number | null {
    if (this.loadedModels.length === 0) {
      return null;
    }

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.loadedModels.length; index += 1) {
      const modelAngle = index * this.angleStep;
      const distance = Math.abs(wrapToPi(modelAngle - orbitAngle));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    return bestIndex;
  }

  // Walks up hit-object parent chain to recover model index marker.
  findModelIndexFromObject(object: THREE.Object3D): number | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (typeof current.userData.modelIndex === 'number') {
        return current.userData.modelIndex as number;
      }

      current = current.parent;
    }

    return null;
  }

  // Explicitly dispose geometry/materials for all model meshes.
  // Three.js does not free GPU resources automatically.
  dispose(): void {
    this.group.traverse((node: THREE.Object3D) => {
      if (!(node instanceof THREE.Mesh)) {
        return;
      }

      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        material.dispose();
      }
    });
  }

  // Normalizes model scale so all imported assets look similar in scene.
  // Also recenters local pivot for predictable ring placement/rotation.
  private normalizeModelSize(root: THREE.Object3D): void {
    const bbox = new THREE.Box3().setFromObject(root);
    const size = bbox.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z) || 1;
    const scaleFactor = this.targetModelSize / largestDimension;
    root.scale.setScalar(scaleFactor);

    const centeredBbox = new THREE.Box3().setFromObject(root);
    const center = centeredBbox.getCenter(new THREE.Vector3());
    root.position.sub(center);
  }
}
