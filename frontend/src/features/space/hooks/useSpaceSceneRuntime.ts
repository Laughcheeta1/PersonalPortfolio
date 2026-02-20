import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  normalizeNavigationTarget,
  sceneInformationCategories,
  validateSceneCategoryMappings,
} from '../../information';
import type { AvatarScreenAnchor } from '../../chatbot/models';
import type {
  CategoryId,
  InformationItemSelection,
  SceneNavigationTarget,
} from '../../information/models';
import { SpaceSceneRuntime } from '../runtime/SpaceSceneRuntime';
import { SPACE_MODELS } from '../spaceModels';

type LoadingState = {
  active: boolean;
  progress: number;
  label: string;
};

export function useSpaceSceneRuntime() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<SpaceSceneRuntime | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedInfoItem, setSelectedInfoItem] = useState<InformationItemSelection | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    active: true,
    progress: 0,
    label: 'Preparing scene...',
  });
  const [avatarAnchor, setAvatarAnchor] = useState<AvatarScreenAnchor>({
    x: 180,
    y: 210,
    visible: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let isMounted = true;

    const runtime = new SpaceSceneRuntime({
      container,
      models: SPACE_MODELS,
      categories: sceneInformationCategories,
      onSelectionChange: setSelectedIndex,
      onInfoItemSelectionChange: setSelectedInfoItem,
      onLoadingStateChange: (state) => {
        if (!isMounted) {
          return;
        }
        setLoadingState(state);
      },
      onAvatarScreenAnchorChange: (anchor) => {
        if (!isMounted) {
          return;
        }
        setAvatarAnchor((prev) => {
          const changed =
            prev.visible !== anchor.visible ||
            Math.abs(prev.x - anchor.x) > 0.5 ||
            Math.abs(prev.y - anchor.y) > 0.5;
          return changed ? anchor : prev;
        });
      },
    });

    const mappingIssues = validateSceneCategoryMappings(SPACE_MODELS.length);
    if (mappingIssues.length > 0) {
      console.warn('[SpaceShowcase] Invalid category/model mappings:', mappingIssues);
    }

    runtimeRef.current = runtime;
    runtime.setCardDesignIndex(0);
    void runtime.start().catch((error) => {
      console.error('[SpaceShowcase] Failed to start scene runtime:', error);
      if (!isMounted) {
        return;
      }
      setLoadingState({
        active: true,
        progress: 1,
        label: 'Failed to load scene. Please refresh.',
      });
    });

    window.portfolioNavigateTo = (target: SceneNavigationTarget) => {
      runtime.navigateTo(normalizeNavigationTarget(target));
    };

    return () => {
      isMounted = false;
      runtime.dispose();
      runtimeRef.current = null;
      delete window.portfolioNavigateTo;
    };
  }, []);

  const setPandaSpeaking = useCallback((speaking: boolean) => {
    runtimeRef.current?.setPandaSpeaking(speaking);
  }, []);

  const setCategorySubcategoryFilter = useCallback(
    (categoryId: CategoryId, subcategoryId?: string) => {
      runtimeRef.current?.setCategorySubcategoryFilter(categoryId, subcategoryId);
    },
    [],
  );

  const selectedCategoryLabel = useMemo(
    () =>
      selectedIndex === null
        ? ''
        : sceneInformationCategories.find((category) => category.modelIndex === selectedIndex)?.label ?? '',
    [selectedIndex],
  );

  return {
    containerRef,
    selectedInfoItem,
    setSelectedInfoItem,
    loadingState,
    selectedCategoryLabel,
    avatarAnchor,
    setPandaSpeaking,
    setCategorySubcategoryFilter,
  };
}
