import * as THREE from 'three/src/Three.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import backgroundExrUrl from '../../../assets/exr/sunflowers_puresky_1k.exr';
import pandaNotSpeakingUrl from '../../../assets/images/Panda_monk_not_speaking.png';
import pandaSpeakingUrl from '../../../assets/images/Panda_monk_speaking.png';
import { PandaMonkAvatar } from '../../chatbot/scene/PandaMonkAvatar';
import { resolveNavigationTarget } from '../../information/navigation';
import { InfoCardRings } from '../InfoCardRings';
import { ModelRingManager } from './ModelRingManager';
import { OrbitCameraController } from './OrbitCameraController';
import { pickSceneObject } from './picking';
import type { RuntimeLoadingState, RuntimeOptions } from './types';
import type {
  CategoryId,
  InformationItemSelection,
  SceneNavigationTarget,
} from '../../information/models';

// Orchestrates high-level runtime flow while delegated modules own specific logic.
export class SpaceSceneRuntime {
  private readonly container: HTMLDivElement;
  private readonly models: RuntimeOptions['models'];
  private readonly categories: RuntimeOptions['categories'];
  private readonly onSelectionChange: RuntimeOptions['onSelectionChange'];
  private readonly onInfoItemSelectionChange: RuntimeOptions['onInfoItemSelectionChange'];
  private readonly onLoadingStateChange: RuntimeOptions['onLoadingStateChange'];

  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloomPass: UnrealBloomPass;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly infoCardRings = new InfoCardRings();
  private readonly modelRing: ModelRingManager;
  private readonly cameraController: OrbitCameraController;
  private readonly exrLoader = new EXRLoader();
  private readonly pandaMonkAvatar: PandaMonkAvatar;
  private readonly clock = new THREE.Clock();

  private animationId = 0;
  private disposed = false;
  private environmentTexture: THREE.Texture | null = null;
  private selectedIndex: number | null = null;
  private pendingNavigationTarget: SceneNavigationTarget | null = null;
  private readonly categorySubcategoryFilters = new Map<CategoryId, string>();

  private readonly onPointerDownBound = (event: PointerEvent) => this.onPointerDown(event);
  private readonly onPointerMoveBound = (event: PointerEvent) => this.onPointerMove(event);
  private readonly onPointerUpBound = (event: PointerEvent) => this.onPointerUp(event);
  private readonly onPointerLeaveBound = () => this.onPointerLeave();
  private readonly onKeyDownBound = (event: KeyboardEvent) => this.onKeyDown(event);
  private readonly onResizeBound = () => this.onResize();

  constructor(options: RuntimeOptions) {
    this.container = options.container;
    this.models = options.models;
    this.categories = options.categories;
    this.onSelectionChange = options.onSelectionChange;
    this.onInfoItemSelectionChange = options.onInfoItemSelectionChange;
    this.onLoadingStateChange = options.onLoadingStateChange;

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

    const angleStep = (Math.PI * 2) / options.models.length;
    this.cameraController = new OrbitCameraController({
      angleStep,
      baseOrbitRadius: 30,
      baseOrbitHeight: 5.5,
      autoRotateSpeed: 0.18,
      pointerSensitivity: 0.006,
      snapThreshold: 0.52,
      snapStrength: 0.042,
    });

    const categoryLabelsByModelIndex = options.models.map((_, modelIndex) => {
      return this.categories.find((category) => category.modelIndex === modelIndex)?.label ?? '';
    });
    this.modelRing = new ModelRingManager(options.models.length, 22, 3.8, categoryLabelsByModelIndex);
    this.scene.add(this.modelRing.group);
    this.scene.add(this.infoCardRings.group);
    this.pandaMonkAvatar = new PandaMonkAvatar({
      scene: this.scene,
      camera: this.camera,
      container: this.container,
      onScreenAnchorChange: options.onAvatarScreenAnchorChange,
    });
    this.setupLights();
    this.bindEvents();
  }

  async start(): Promise<void> {
    this.emitLoadingState({ active: true, progress: 0.03, label: 'Preparing renderer...' });
    await this.loadEnvironment();
    this.emitLoadingState({ active: true, progress: 0.12, label: 'Environment ready. Loading models...' });
    await this.modelRing.load(this.models, () => this.disposed, (loadedCount, totalCount, modelName) => {
      const progress = 0.12 + (loadedCount / Math.max(totalCount, 1)) * 0.88;
      this.emitLoadingState({
        active: true,
        progress,
        label: `Loading model ${loadedCount}/${totalCount}: ${modelName}`,
      });
    });
    if (this.disposed) {
      return;
    }
    this.emitLoadingState({ active: true, progress: 0.96, label: 'Loading portfolio guide avatar...' });
    await this.pandaMonkAvatar.load({
      idle: pandaNotSpeakingUrl,
      speaking: pandaSpeakingUrl,
    });
    if (this.disposed) {
      return;
    }
    this.modelRing.highlightSelection(this.selectedIndex, this.bloomPass);
    this.emitLoadingState({ active: false, progress: 1, label: 'Scene ready' });
    this.animate();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.unbindEvents();
    this.modelRing.dispose();
    this.infoCardRings.dispose();
    this.composer.dispose();

    if (this.environmentTexture) {
      this.environmentTexture.dispose();
      this.environmentTexture = null;
    }
    this.pandaMonkAvatar.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  setSelection(index: number | null): void {
    if (index !== null && !this.modelRing.isValidIndex(index)) {
      return;
    }
    if (this.selectedIndex === index) {
      return;
    }

    this.selectedIndex = index;
    this.modelRing.highlightSelection(this.selectedIndex, this.bloomPass);
    this.rebuildInfoCards();
    this.onSelectionChange(index);
    this.onInfoItemSelectionChange(null);
  }

  setCardDesignIndex(index: number): void {
    this.infoCardRings.setCardDesignIndex(index);
    this.rebuildInfoCards();
  }

  setPandaSpeaking(speaking: boolean): void {
    this.pandaMonkAvatar.setSpeaking(speaking);
  }

  setCategorySubcategoryFilter(categoryId: CategoryId, subcategoryId?: string): void {
    if (subcategoryId) {
      this.categorySubcategoryFilters.set(categoryId, subcategoryId);
    } else {
      this.categorySubcategoryFilters.delete(categoryId);
    }

    const selectedCategory = this.getSelectedCategory();
    if (selectedCategory?.id === categoryId) {
      this.rebuildInfoCards();
    }
  }

  navigateTo(target: SceneNavigationTarget): void {
    const normalized = resolveNavigationTarget(this.categories, target);
    if (!normalized) {
      return;
    }

    this.pendingNavigationTarget = normalized;
    const category = this.categories.find((entry) => entry.id === normalized.categoryId);
    if (!category) {
      return;
    }

    this.setSelection(category.modelIndex);
    this.applyPendingNavigationTarget();
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

  private emitLoadingState(state: RuntimeLoadingState): void {
    this.onLoadingStateChange({
      ...state,
      progress: Math.min(1, Math.max(0, state.progress)),
    });
  }

  private rebuildInfoCards(): void {
    const selectedCategory = this.getSelectedCategory();
    const selectedSubcategoryFilter = selectedCategory
      ? this.categorySubcategoryFilters.get(selectedCategory.id)
      : undefined;
    this.infoCardRings.rebuild(selectedCategory, undefined, selectedSubcategoryFilter);
    this.applyPendingNavigationTarget();
  }

  private getSelectedCategory() {
    if (this.selectedIndex === null) {
      return null;
    }
    return this.categories.find((entry) => entry.modelIndex === this.selectedIndex) ?? null;
  }

  private applyPendingNavigationTarget(): void {
    const target = this.pendingNavigationTarget;
    if (!target) {
      return;
    }

    const category = this.getSelectedCategory();
    if (!category || category.id !== target.categoryId) {
      return;
    }

    if (!target.itemId) {
      this.pendingNavigationTarget = null;
      return;
    }

    const selection = this.infoCardRings.findSelectionByTarget(target.itemId, target.subcategoryId);
    if (selection) {
      this.openInfoCard(selection);
    }
    this.pendingNavigationTarget = null;
  }

  private openInfoCard(selection: InformationItemSelection): void {
    this.onInfoItemSelectionChange(selection);
  }

  private animate = (): void => {
    if (this.disposed) {
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 0.06);
    const focusTarget = this.modelRing.getFocusTarget(this.selectedIndex);
    this.cameraController.update(dt, this.camera, focusTarget);

    this.infoCardRings.update(
      dt,
      this.camera,
      this.selectedIndex !== null,
      focusTarget
        ? {
            center: focusTarget.position,
            radius: focusTarget.orbitRadius,
            orbitHeight: focusTarget.orbitHeight,
          }
        : undefined,
    );
    this.modelRing.updateCategoryTitleVisibility(this.selectedIndex === null);
    this.pandaMonkAvatar.update(dt, this.clock.elapsedTime, focusTarget?.position ?? null);

    this.composer.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

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

  private onPointerDown(event: PointerEvent): void {
    this.cameraController.onPointerDown(event.clientX);
  }

  private onPointerMove(event: PointerEvent): void {
    this.cameraController.onPointerMove(event.clientX);
  }

  private onPointerUp(event: PointerEvent): void {
    const canClick = this.cameraController.endPointerInteraction();
    if (!canClick) {
      return;
    }

    const pickResult = pickSceneObject({
      event,
      rendererDomElement: this.renderer.domElement,
      camera: this.camera,
      raycaster: this.raycaster,
      pointerNdc: this.pointerNdc,
      cardRoot: this.infoCardRings.group,
      modelRoot: this.modelRing.group,
      getCardSelectionByObject: (object) => this.infoCardRings.getSelectionByObject(object),
      getModelIndexByObject: (object) => this.modelRing.findModelIndexFromObject(object),
    });

    if (!pickResult) {
      this.setSelection(null);
      return;
    }

    if (pickResult.type === 'card') {
      this.openInfoCard(pickResult.selection);
      return;
    }

    this.setSelection(pickResult.modelIndex);
  }

  private onPointerLeave(): void {
    this.cameraController.cancelPointerInteraction();
  }

  private onKeyDown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      this.cameraController.nudgeLeft();
      return;
    }
    if (event.key === 'ArrowRight') {
      this.cameraController.nudgeRight();
      return;
    }
    if (event.key === 'Escape') {
      this.setSelection(null);
      this.onInfoItemSelectionChange(null);
    }
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
