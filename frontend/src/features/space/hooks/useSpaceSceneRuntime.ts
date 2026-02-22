import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getSceneInformationCategories,
  normalizeNavigationTarget,
  validateSceneCategoryMappings,
} from '../../information';
import type { AvatarScreenAnchor } from '../../chatbot/models';
import { useI18n } from '../../i18n/useI18n';
import { CATEGORY_KEY_BY_ID, SUBCATEGORY_KEY_BY_ID } from '../../information/i18nKeys';
import type { CategoryId, InformationItemSelection, InformationSceneCategory, SceneNavigationTarget } from '../../information/models';
import { SpaceSceneRuntime } from '../runtime/SpaceSceneRuntime';
import { SPACE_MODELS } from '../spaceModels';
import type { PandaMonkAvatarState } from '../../chatbot/scene/PandaMonkAvatar';

type LoadingState = {
  active: boolean;
  progress: number;
  label: string;
};

export function useSpaceSceneRuntime() {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<SpaceSceneRuntime | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedInfoItem, setSelectedInfoItem] = useState<InformationItemSelection | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    active: true,
    progress: 0,
    label: t('runtime.loading.preparingScene'),
  });
  const [avatarAnchor, setAvatarAnchor] = useState<AvatarScreenAnchor>({
    x: 180,
    y: 210,
    visible: false,
  });

  const localizedModels = useMemo(
    () =>
      SPACE_MODELS.map((model, index) => ({
        ...model,
        name: t(`model.${index}`),
      })),
    [t],
  );

  const localizedCategories = useMemo<InformationSceneCategory[]>(
    () =>
      getSceneInformationCategories(locale).map((category) => ({
        ...category,
        label: t(CATEGORY_KEY_BY_ID[category.id] ?? category.label),
        subcategories: category.subcategories.map((subcategory) => ({
          ...subcategory,
          label: t(SUBCATEGORY_KEY_BY_ID[subcategory.id] ?? subcategory.label),
        })),
      })),
    [locale, t],
  );

  const loadingMessages = useMemo(
    () => ({
      preparingRenderer: t('runtime.loading.preparingRenderer'),
      environmentReadyLoadingModels: t('runtime.loading.environmentReady'),
      loadingModel: (loadedCount: number, totalCount: number, modelName: string) =>
        t('runtime.loading.loadingModel', {
          loaded: loadedCount,
          total: totalCount,
          model: modelName,
        }),
      loadingAvatar: t('runtime.loading.loadingAvatar'),
      sceneReady: t('runtime.loading.sceneReady'),
    }),
    [t],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let isMounted = true;

    const runtime = new SpaceSceneRuntime({
      container,
      models: localizedModels,
      categories: localizedCategories,
      onSelectionChange: setSelectedIndex,
      onInfoItemSelectionChange: setSelectedInfoItem,
      onLoadingStateChange: (state) => {
        if (!isMounted) {
          return;
        }
        setLoadingState(state);
      },
      loadingMessages,
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

    const mappingIssues = validateSceneCategoryMappings(localizedModels.length, localizedCategories);
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
        label: t('runtime.loading.failedScene'),
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
  }, [localizedCategories, localizedModels, loadingMessages, t]);

  const setPandaState = useCallback((state: PandaMonkAvatarState) => {
    runtimeRef.current?.setPandaState(state);
  }, []);

  const deselectModel = useCallback(() => {
    runtimeRef.current?.setSelection(null);
  }, []);

  const setCategorySubcategoryFilter = useCallback(
    (categoryId: CategoryId, subcategoryIds?: string[]) => {
      runtimeRef.current?.setCategorySubcategoryFilter(categoryId, subcategoryIds);
    },
    [],
  );

  const selectedCategory = useMemo(
    () =>
      selectedIndex === null
        ? null
        : localizedCategories.find((category) => category.modelIndex === selectedIndex) ?? null,
    [localizedCategories, selectedIndex],
  );

  const selectedCategoryLabel = useMemo(
    () => selectedCategory?.label ?? '',
    [selectedCategory],
  );

  return {
    containerRef,
    selectedInfoItem,
    setSelectedInfoItem,
    loadingState,
    selectedCategory,
    selectedCategoryLabel,
    avatarAnchor,
    setPandaState,
    deselectModel,
    setCategorySubcategoryFilter,
  };
}
