import type * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
} from '../../information/models';
import type { SpaceModelItem } from '../spaceModels';

// Input contract used by the runtime constructor.
// This keeps runtime decoupled from React by receiving plain callbacks/data.
export type RuntimeOptions = {
  // DOM element that will host the renderer canvas.
  container: HTMLDivElement;
  // Ordered list of GLTF models that form the 3D ring.
  models: SpaceModelItem[];
  // Information categories used to build card rows for selected model.
  categories: InformationSceneCategory[];
  // Callback to update host UI when model selection changes.
  onSelectionChange: (index: number | null) => void;
  // Callback to open/close info panel when card selection changes.
  onInfoItemSelectionChange: (selection: InformationItemSelection | null) => void;
};

// Camera orbit target used during focused mode.
// position = center point of selected model in world-space.
export type FocusTarget = {
  position: THREE.Vector3;
  // Radius used for camera orbit around selected model.
  orbitRadius: number;
  // Vertical lift for focused camera orbit.
  orbitHeight: number;
};

// Loaded model cache:
// holder = transform root placed on ring
// meshes = flattened mesh list for quick highlight updates
export type LoadedModel = {
  holder: THREE.Group;
  meshes: THREE.Mesh[];
};
