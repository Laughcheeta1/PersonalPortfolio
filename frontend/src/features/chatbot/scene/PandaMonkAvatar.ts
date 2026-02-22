import * as THREE from 'three/src/Three.js';

import type { AvatarScreenAnchor } from '../models';

type PandaMonkAvatarOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  container: HTMLDivElement;
  onScreenAnchorChange: (anchor: AvatarScreenAnchor) => void;
};

type PandaMonkTextureUrls = {
  idle: string;
  speaking: string;
  thinking: string;
};

export type PandaMonkAvatarState = 'idle' | 'thinking' | 'speaking';

export class PandaMonkAvatar {
  private static readonly DEFAULT_BOB_AMPLITUDE = 0.09;
  private static readonly FOCUSED_BOB_AMPLITUDE = PandaMonkAvatar.DEFAULT_BOB_AMPLITUDE * 0.5;

  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly container: HTMLDivElement;
  private readonly onScreenAnchorChange: (anchor: AvatarScreenAnchor) => void;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly targetPosition = new THREE.Vector3(0, 2.25, 0);
  private readonly currentPosition = new THREE.Vector3(0, 2.25, 0);
  private readonly cameraForward = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly worldUp = new THREE.Vector3(0, 1, 0);
  private readonly defaultScale = new THREE.Vector3(1, 1, 1);
  private readonly focusScale = new THREE.Vector3(1, 1, 1);
  private readonly targetScale = new THREE.Vector3(1, 1, 1);
  private readonly projectedPosition = new THREE.Vector3();
  private lastAnchor: AvatarScreenAnchor = { x: Number.NaN, y: Number.NaN, visible: false };

  private sprite: THREE.Sprite | null = null;
  private spriteMaterial: THREE.SpriteMaterial | null = null;
  private idleTexture: THREE.Texture | null = null;
  private speakingTexture: THREE.Texture | null = null;
  private thinkingTexture: THREE.Texture | null = null;
  private state: PandaMonkAvatarState = 'idle';

  constructor(options: PandaMonkAvatarOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.container = options.container;
    this.onScreenAnchorChange = options.onScreenAnchorChange;
  }

  async load(textureUrls: PandaMonkTextureUrls): Promise<void> {
    const [idleTexture, speakingTexture, thinkingTexture] = await Promise.all([
      this.textureLoader.loadAsync(textureUrls.idle),
      this.textureLoader.loadAsync(textureUrls.speaking),
      this.textureLoader.loadAsync(textureUrls.thinking),
    ]);
    idleTexture.colorSpace = THREE.SRGBColorSpace;
    idleTexture.needsUpdate = true;
    speakingTexture.colorSpace = THREE.SRGBColorSpace;
    speakingTexture.needsUpdate = true;
    thinkingTexture.colorSpace = THREE.SRGBColorSpace;
    thinkingTexture.needsUpdate = true;
    this.idleTexture = idleTexture;
    this.speakingTexture = speakingTexture;
    this.thinkingTexture = thinkingTexture;

    const material = new THREE.SpriteMaterial({
      map: this.idleTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });

    const sprite = new THREE.Sprite(material);
    const image = this.idleTexture.image as { width?: number; height?: number } | undefined;
    const aspectRatio =
      image && typeof image.width === 'number' && typeof image.height === 'number' && image.height > 0
        ? image.width / image.height
        : 1;
    const spriteHeight = 5;
    sprite.scale.set(spriteHeight * aspectRatio, spriteHeight, 1);
    this.defaultScale.copy(sprite.scale);
    this.focusScale.copy(sprite.scale).multiplyScalar(0.72);
    this.targetScale.copy(this.defaultScale);
    sprite.position.copy(this.currentPosition);
    this.scene.add(sprite);
    this.spriteMaterial = material;
    this.sprite = sprite;
    this.applyAvatarState();
  }

  dispose(): void {
    const sprite = this.sprite;
    if (!sprite) {
      return;
    }

    this.scene.remove(sprite);
    if (this.spriteMaterial) {
      this.spriteMaterial.dispose();
      this.spriteMaterial = null;
    }
    this.idleTexture?.dispose();
    this.speakingTexture?.dispose();
    this.thinkingTexture?.dispose();
    this.idleTexture = null;
    this.speakingTexture = null;
    this.thinkingTexture = null;
    this.sprite = null;
  }

  setState(state: PandaMonkAvatarState): void {
    if (this.state === state) {
      return;
    }
    this.state = state;
    this.applyAvatarState();
  }

  update(dt: number, elapsedTime: number, focusPosition: THREE.Vector3 | null): void {
    const sprite = this.sprite;
    if (!sprite) {
      return;
    }

    if (focusPosition) {
      this.camera.getWorldDirection(this.cameraForward);
      this.cameraRight.crossVectors(this.cameraForward, this.worldUp).normalize();
      this.targetPosition.copy(focusPosition);
      this.targetPosition.addScaledVector(this.cameraRight, 2.7);
      this.targetPosition.y -= 0.2;
      this.targetScale.copy(this.focusScale);
    } else {
      this.camera.getWorldDirection(this.cameraForward);
      this.targetPosition.set(0, 0, 0);
      this.targetPosition.addScaledVector(this.cameraForward, -3.8);
      this.targetPosition.y = 1.35;
      this.targetScale.copy(this.defaultScale);
    }

    const followStrength = Math.min(0.08 + dt * 3.2, 0.22);
    this.currentPosition.lerp(this.targetPosition, followStrength);
    sprite.scale.lerp(this.targetScale, followStrength);

    const bobAmplitude = focusPosition
      ? PandaMonkAvatar.FOCUSED_BOB_AMPLITUDE
      : PandaMonkAvatar.DEFAULT_BOB_AMPLITUDE;
    const bobOffset = Math.sin(elapsedTime * 2.8) * bobAmplitude;
    sprite.position.set(this.currentPosition.x, this.currentPosition.y + bobOffset, this.currentPosition.z);
    sprite.quaternion.copy(this.camera.quaternion);

    this.emitScreenAnchor(sprite.position);
  }

  private applyAvatarState(): void {
    if (!this.spriteMaterial || !this.idleTexture || !this.speakingTexture || !this.thinkingTexture) {
      return;
    }

    if (this.state === 'speaking') {
      this.spriteMaterial.map = this.speakingTexture;
    } else if (this.state === 'thinking') {
      this.spriteMaterial.map = this.thinkingTexture;
    } else {
      this.spriteMaterial.map = this.idleTexture;
    }
    this.spriteMaterial.needsUpdate = true;
  }

  private emitScreenAnchor(worldPosition: THREE.Vector3): void {
    this.projectedPosition.copy(worldPosition).project(this.camera);
    const visible =
      this.projectedPosition.z >= -1 &&
      this.projectedPosition.z <= 1 &&
      this.projectedPosition.x >= -1.25 &&
      this.projectedPosition.x <= 1.25 &&
      this.projectedPosition.y >= -1.25 &&
      this.projectedPosition.y <= 1.25;

    const x = (this.projectedPosition.x * 0.5 + 0.5) * this.container.clientWidth;
    const y = (-this.projectedPosition.y * 0.5 + 0.5) * this.container.clientHeight;

    const changed =
      visible !== this.lastAnchor.visible ||
      Math.abs(x - this.lastAnchor.x) > 0.5 ||
      Math.abs(y - this.lastAnchor.y) > 0.5;
    if (!changed) {
      return;
    }

    this.lastAnchor = { x, y, visible };
    this.onScreenAnchorChange(this.lastAnchor);
  }
}
