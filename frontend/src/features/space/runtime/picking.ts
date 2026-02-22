import * as THREE from 'three/src/Three.js';

import type { InformationItemSelection } from '../../information/models';

// Unified result for pointer picking.
// We return "card" first when both card and model overlap under cursor.
export type ScenePickResult =
  | { type: 'card'; selection: InformationItemSelection }
  | { type: 'model'; modelIndex: number }
  | null;

// Full context needed to perform one raycast pick operation.
// We pass dependencies in as arguments so this function stays stateless and testable.
type PickSceneObjectParams = {
  // Original pointer-up event (screen coordinates source).
  event: PointerEvent;
  // Canvas used to convert screen position -> NDC coordinates.
  rendererDomElement: HTMLCanvasElement;
  // Active camera used for ray construction.
  camera: THREE.PerspectiveCamera;
  // Shared raycaster instance (reused to avoid per-click allocation).
  raycaster: THREE.Raycaster;
  // Reusable vector for normalized device coordinates.
  pointerNdc: THREE.Vector2;
  // Root group for all info cards.
  cardRoot: THREE.Group;
  // Root group for all 3D models.
  modelRoot: THREE.Group;
  // Resolver from hit object -> card selection payload.
  getCardSelectionByObject: (object: THREE.Object3D) => InformationItemSelection | null;
  // Resolver from hit object -> model index.
  getModelIndexByObject: (object: THREE.Object3D) => number | null;
};

// Converts a pointer-up event into either a card hit, model hit, or empty-space hit.
export function pickSceneObject(params: PickSceneObjectParams): ScenePickResult {
  const {
    event,
    rendererDomElement,
    camera,
    raycaster,
    pointerNdc,
    cardRoot,
    modelRoot,
    getCardSelectionByObject,
    getModelIndexByObject,
  } = params;

  // Convert browser screen coordinates into WebGL clip-space range [-1, 1].
  // Three.js raycaster requires this normalized coordinate system.
  const bounds = rendererDomElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

  // Build a 3D ray from camera through cursor point.
  raycaster.setFromCamera(pointerNdc, camera);
  // Test against both card and model roots, recursively including descendants.
  const intersections = raycaster.intersectObjects([cardRoot, modelRoot], true);

  if (intersections.length === 0) {
    return null;
  }

  // Intersections are already sorted nearest-first by Three.js.
  // Enforce hard card-priority across all hits first, then fallback to model.
  for (const hit of intersections) {
    const cardSelection = getCardSelectionByObject(hit.object);
    if (cardSelection) {
      return { type: 'card', selection: cardSelection };
    }
  }

  for (const hit of intersections) {
    const modelIndex = getModelIndexByObject(hit.object);
    if (modelIndex !== null) {
      return { type: 'model', modelIndex };
    }
  }

  return null;
}
