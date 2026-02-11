import * as THREE from 'three/src/Three.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import backgroundExrUrl from '../../assets/exr/sunflowers_puresky_1k.exr';
import type { SpaceModelItem } from './spaceModels';
import { damp, wrapToPi } from './math';

type RuntimeOptions = {
  container: HTMLDivElement;
  models: SpaceModelItem[];
  onSelectionChange: (index: number | null) => void;
};

type FocusTarget = {
  position: THREE.Vector3;
  orbitRadius: number;
  orbitHeight: number;
};

type LoadedModel = {
  holder: THREE.Group;
  meshes: THREE.Mesh[];
};

const TWO_PI = Math.PI * 2;

export class SpaceSceneRuntime {
  private readonly container: HTMLDivElement;
  private readonly models: SpaceModelItem[];
  private readonly onSelectionChange: (index: number | null) => void;

  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloomPass: UnrealBloomPass;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly ringGroup = new THREE.Group();
  private readonly loadedModels: LoadedModel[] = [];

  private readonly loader = new GLTFLoader();
  private readonly exrLoader = new EXRLoader();
  private readonly clock = new THREE.Clock();

  private animationId = 0;
  private disposed = false;
  private environmentTexture: THREE.Texture | null = null;

  private selectedIndex: number | null = null;

  private autoYaw = 0;
  private userYawTarget = 0;
  private userYawCurrent = 0;

  private pointerDown = false;
  private dragging = false;
  private pointerStartX = 0;
  private pointerLastX = 0;

  private readonly ringRadius = 22;
  private readonly targetModelSize = 3.8;
  private readonly angleStep: number;

  private readonly cameraLookAt = new THREE.Vector3(0, 0, 0);
  private readonly desiredCameraPosition = new THREE.Vector3(0, 0, 0);

  private readonly baseOrbitRadius = 30;
  private readonly baseOrbitHeight = 5.5;
  private readonly autoRotateSpeed = 0.18;

  private readonly pointerSensitivity = 0.006;
  private readonly snapThreshold = 0.52;
  private readonly snapStrength = 0.042;

  private readonly onPointerDownBound = (event: PointerEvent) => this.onPointerDown(event);
  private readonly onPointerMoveBound = (event: PointerEvent) => this.onPointerMove(event);
  private readonly onPointerUpBound = (event: PointerEvent) => this.onPointerUp(event);
  private readonly onPointerLeaveBound = () => this.onPointerLeave();
  private readonly onKeyDownBound = (event: KeyboardEvent) => this.onKeyDown(event);
  private readonly onResizeBound = () => this.onResize();

  constructor(options: RuntimeOptions) {
    this.container = options.container;
    this.models = options.models;
    this.onSelectionChange = options.onSelectionChange;
    this.angleStep = TWO_PI / this.models.length;

    // Background is intentionally omitted so it is easy to add later.
    // Example future options:
    // this.scene.background = new THREE.Color('#05070f');
    // this.scene.add(customSkyMesh);

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / Math.max(this.container.clientHeight, 1),
      0.1,
      400,
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.22,
      0.24,
      0.88,
    );
    this.composer.addPass(this.bloomPass);

    this.setupLights();
    this.scene.add(this.ringGroup);

    this.bindEvents();
  }

  async start(): Promise<void> {
    await this.loadEnvironment();
    await this.createModelRing();
    this.updateModelHighlight();
    this.animate();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);

    this.unbindEvents();

    this.ringGroup.traverse((node: THREE.Object3D) => {
      if (!(node instanceof THREE.Mesh)) {
        return;
      }

      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        material.dispose();
      }
    });

    this.composer.dispose();

    if (this.environmentTexture) {
      this.environmentTexture.dispose();
      this.environmentTexture = null;
    }

    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  setSelection(index: number | null): void {
    if (index !== null && (index < 0 || index >= this.loadedModels.length)) {
      return;
    }

    this.selectedIndex = index;
    this.updateModelHighlight();
    this.onSelectionChange(index);
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);

    const keyLight = new THREE.DirectionalLight(0x94d8ff, 2.2);
    keyLight.position.set(16, 14, 8);

    const fillLight = new THREE.DirectionalLight(0xffe0b2, 1.35);
    fillLight.position.set(-12, 6, -10);

    this.scene.add(ambient, keyLight, fillLight);
  }

  private async loadEnvironment(): Promise<void> {
    const texture = await this.exrLoader.loadAsync(backgroundExrUrl);
    if (this.disposed) {
      texture.dispose();
      return;
    }

    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;
    this.scene.environmentIntensity = 0.35;
    this.environmentTexture = texture;
  }

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMoveBound);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUpBound);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeaveBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('resize', this.onResizeBound);
  }

  private unbindEvents(): void {
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMoveBound);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUpBound);
    this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeaveBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('resize', this.onResizeBound);
  }

  private async createModelRing(): Promise<void> {
    for (let index = 0; index < this.models.length; index += 1) {
      const gltf = await this.loader.loadAsync(this.models[index].url);
      if (this.disposed) {
        return;
      }

      const holder = new THREE.Group();
      holder.userData.modelIndex = index;

      const root = gltf.scene;
      this.normalizeModelSize(root);

      const meshes: THREE.Mesh[] = [];
      root.traverse((node: THREE.Object3D) => {
        if (!(node instanceof THREE.Mesh)) {
          return;
        }

        node.castShadow = false;
        node.receiveShadow = false;
        node.userData.modelIndex = index;
        meshes.push(node);
      });

      const angle = index * this.angleStep;
      holder.position.set(Math.cos(angle) * this.ringRadius, 0, Math.sin(angle) * this.ringRadius);
      holder.lookAt(0, 0, 0);

      holder.add(root);
      this.ringGroup.add(holder);
      this.loadedModels.push({ holder, meshes });
    }
  }

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

  private updateModelHighlight(): void {
    for (let index = 0; index < this.loadedModels.length; index += 1) {
      const model = this.loadedModels[index];
      const active = index === this.selectedIndex;

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

    this.bloomPass.strength = this.selectedIndex === null ? 0.22 : 0.34;
  }

  private animate = (): void => {
    if (this.disposed) {
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 0.06);

    this.autoYaw += this.autoRotateSpeed * dt;

    if (!this.dragging && this.selectedIndex === null) {
      const combinedYaw = this.autoYaw + this.userYawTarget;
      const snapAngle = Math.round(combinedYaw / this.angleStep) * this.angleStep;
      const snapDelta = wrapToPi(snapAngle - combinedYaw);

      if (Math.abs(snapDelta) < this.snapThreshold) {
        this.userYawTarget += snapDelta * this.snapStrength;
      }
    }

    this.userYawCurrent = damp(this.userYawCurrent, this.userYawTarget, Math.min(0.12 + dt * 2, 0.22));

    const orbitAngle = this.autoYaw + this.userYawCurrent;
    const focusTarget = this.getFocusTarget();

    if (focusTarget) {
      this.desiredCameraPosition.set(
        focusTarget.position.x + Math.sin(orbitAngle) * focusTarget.orbitRadius,
        focusTarget.position.y + focusTarget.orbitHeight,
        focusTarget.position.z + Math.cos(orbitAngle) * focusTarget.orbitRadius,
      );
      this.cameraLookAt.lerp(focusTarget.position, 0.11);
    } else {
      this.desiredCameraPosition.set(
        Math.sin(orbitAngle) * this.baseOrbitRadius,
        this.baseOrbitHeight,
        Math.cos(orbitAngle) * this.baseOrbitRadius,
      );
      this.cameraLookAt.lerp(new THREE.Vector3(0, 0, 0), 0.08);
    }

    this.camera.position.lerp(this.desiredCameraPosition, 0.08);
    this.camera.lookAt(this.cameraLookAt);

    this.composer.render();

    this.animationId = requestAnimationFrame(this.animate);
  };

  private getFocusTarget(): FocusTarget | null {
    if (this.selectedIndex === null) {
      return null;
    }

    const model = this.loadedModels[this.selectedIndex];
    if (!model) {
      return null;
    }

    return {
      position: model.holder.position.clone(),
      orbitRadius: 7.4,
      orbitHeight: 2.7,
    };
  }

  private onPointerDown(event: PointerEvent): void {
    this.pointerDown = true;
    this.dragging = false;
    this.pointerStartX = event.clientX;
    this.pointerLastX = event.clientX;
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.pointerDown) {
      return;
    }

    const deltaX = event.clientX - this.pointerLastX;
    const movedX = Math.abs(event.clientX - this.pointerStartX);
    this.pointerLastX = event.clientX;

    if (movedX > 4) {
      this.dragging = true;
    }

    this.userYawTarget -= deltaX * this.pointerSensitivity;
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.pointerDown) {
      return;
    }

    const wasDragging = this.dragging;
    this.pointerDown = false;
    this.dragging = false;

    if (wasDragging) {
      return;
    }

    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const intersections = this.raycaster.intersectObjects(this.ringGroup.children, true);

    if (intersections.length === 0) {
      this.setSelection(null);
      return;
    }

    let modelIndex: number | null = null;
    for (const hit of intersections) {
      let current: THREE.Object3D | null = hit.object;
      while (current) {
        if (typeof current.userData.modelIndex === 'number') {
          modelIndex = current.userData.modelIndex as number;
          break;
        }
        current = current.parent;
      }

      if (modelIndex !== null) {
        break;
      }
    }

    this.setSelection(modelIndex);
  }

  private onPointerLeave(): void {
    this.pointerDown = false;
    this.dragging = false;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.userYawTarget += 0.16;
      return;
    }

    if (event.key === 'ArrowRight') {
      this.userYawTarget -= 0.16;
      return;
    }

    if (event.key === 'Enter') {
      this.focusNearestModel();
      return;
    }

    if (event.key === 'Escape') {
      this.setSelection(null);
    }
  }

  private focusNearestModel(): void {
    if (this.loadedModels.length === 0) {
      return;
    }

    const currentAngle = this.autoYaw + this.userYawCurrent;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.loadedModels.length; index += 1) {
      const modelAngle = index * this.angleStep;
      const distance = Math.abs(wrapToPi(modelAngle - currentAngle));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    this.setSelection(bestIndex);
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = Math.max(this.container.clientHeight, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }
}
