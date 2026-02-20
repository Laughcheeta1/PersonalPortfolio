import type { SceneNavigationTarget } from '../features/information/models';

declare global {
  interface Window {
    portfolioNavigateTo?: (target: SceneNavigationTarget) => void;
  }
}

export {};
