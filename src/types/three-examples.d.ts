declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import type * as THREE from 'three/src/Three.js';

  export type GLTF = {
    scene: THREE.Group;
  };

  export class GLTFLoader {
    loadAsync(url: string): Promise<GLTF>;
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer.js' {
  import type * as THREE from 'three/src/Three.js';

  export class EffectComposer {
    constructor(renderer: THREE.WebGLRenderer);
    addPass(pass: object): void;
    render(): void;
    setSize(width: number, height: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass.js' {
  import type * as THREE from 'three/src/Three.js';

  export class RenderPass {
    constructor(scene: THREE.Scene, camera: THREE.Camera);
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass.js' {
  import type * as THREE from 'three/src/Three.js';

  export class UnrealBloomPass {
    constructor(resolution: THREE.Vector2, strength: number, radius: number, threshold: number);
    strength: number;
  }
}
