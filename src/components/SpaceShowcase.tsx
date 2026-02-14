import { type ReactNode, useEffect, useRef, useState } from 'react';

import {
  normalizeNavigationTarget,
  sceneInformationCategories,
  validateSceneCategoryMappings,
} from '../features/information';
import { getSafeExternalHref } from '../features/information/urlSafety';
import type {
  InformationItemSelection,
  SceneNavigationTarget,
} from '../features/information/models';
import assetCreditsJson from '../features/information/data/assetCredits.json';
import { startAmbientHum, type AmbientHumController } from '../features/space/ambientHum';
import { SpaceSceneRuntime } from '../features/space/runtime/SpaceSceneRuntime';
import { SPACE_MODELS } from '../features/space/spaceModels';

declare global {
  interface Window {
    portfolioNavigateTo?: (target: SceneNavigationTarget) => void;
  }
}

const SpaceShowcase = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<SpaceSceneRuntime | null>(null);
  const humRef = useRef<AmbientHumController | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedInfoItem, setSelectedInfoItem] = useState<InformationItemSelection | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [loadingState, setLoadingState] = useState({
    active: true,
    progress: 0,
    label: 'Preparing scene...',
  });
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isPortraitViewport, setIsPortraitViewport] = useState(false);

  type AssetCreditItem = {
    name: string;
    author?: string;
    sourceUrl?: string;
    notes?: string;
  };

  type AssetCreditsConfig = {
    music: AssetCreditItem[];
    hdri: AssetCreditItem[];
    models: AssetCreditItem[];
  };

  const assetCredits = assetCreditsJson as AssetCreditsConfig;
  const renderExternalLink = (
    href: string | undefined,
    children: ReactNode,
    key: string,
    className?: string,
  ) => {
    const safeHref = getSafeExternalHref(href);
    if (!safeHref) {
      return null;
    }

    return (
      <a key={key} href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  };

  useEffect(() => {
    const updateViewportHints = () => {
      const isSmallScreen = window.matchMedia('(max-width: 900px)').matches;
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobileViewport(isSmallScreen || isCoarsePointer);
      setIsPortraitViewport(window.matchMedia('(orientation: portrait)').matches);
    };

    updateViewportHints();
    window.addEventListener('resize', updateViewportHints);
    window.addEventListener('orientationchange', updateViewportHints);

    return () => {
      window.removeEventListener('resize', updateViewportHints);
      window.removeEventListener('orientationchange', updateViewportHints);
    };
  }, []);

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

  useEffect(() => {
    if (!isAudioOn) {
      humRef.current?.stop();
      humRef.current = null;
      return;
    }

    humRef.current = startAmbientHum();

    return () => {
      humRef.current?.stop();
      humRef.current = null;
    };
  }, [isAudioOn]);

  useEffect(() => {
    const unlockAudio = () => {
      if (!isAudioOn) {
        return;
      }
      humRef.current?.ensurePlaying();
    };

    const passiveOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('pointerdown', unlockAudio, passiveOptions);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, passiveOptions);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio, passiveOptions);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio, passiveOptions);
    };
  }, [isAudioOn]);

  const selectedCategoryLabel =
    selectedIndex === null
      ? ''
      : sceneInformationCategories.find((category) => category.modelIndex === selectedIndex)?.label ?? '';

  return (
    <section className="space-page">
      <div ref={containerRef} className="space-canvas" aria-label="Interactive 3D portfolio scene" />
      {loadingState.active ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-card">
            <p className="loading-title">Loading 3D Portfolio</p>
            <p className="loading-label">{loadingState.label}</p>
            {isMobileViewport ? (
              <p className="loading-mobile-tip">
                {isPortraitViewport
                  ? 'For the best experience, rotate your phone to landscape.'
                  : 'Landscape mode gives the best viewing experience on mobile.'}
              </p>
            ) : null}
            <div className="loading-track" aria-hidden="true">
              <div
                className="loading-fill"
                style={{ width: `${Math.round(loadingState.progress * 100)}%` }}
              />
            </div>
            <p className="loading-percent">{Math.round(loadingState.progress * 100)}%</p>
          </div>
        </div>
      ) : null}

      <div className={`focus-label ${selectedCategoryLabel ? 'show' : ''}`}>{selectedCategoryLabel}</div>

      <button
        type="button"
        className="ambient-audio-toggle"
        onClick={() => setIsAudioOn((prev) => !prev)}
      >
        {isAudioOn ? 'Music: On' : 'Music: Off'}
      </button>

      <button
        type="button"
        className="asset-credits-toggle"
        onClick={() => setIsCreditsOpen((prev) => !prev)}
      >
        {isCreditsOpen ? 'Hide Sources' : 'Show Sources'}
      </button>

      {isCreditsOpen ? (
        <aside className="asset-credits-panel">
          <div className="asset-credits-topline">
            <span>Asset Credits</span>
            <button type="button" onClick={() => setIsCreditsOpen(false)}>
              Close
            </button>
          </div>

          <p><strong>Music:</strong></p>
          <div className="asset-credits-links">
            {assetCredits.music.map((credit) =>
              credit.sourceUrl ? (
                renderExternalLink(
                  credit.sourceUrl,
                  `${credit.name} - ${credit.author ?? 'Unknown'}`,
                  `music-${credit.name}`,
                )
              ) : (
                <p key={`music-${credit.name}`}>
                  {credit.name} - {credit.author ?? 'Unknown'}
                  {credit.notes ? ` (${credit.notes})` : ''}
                </p>
              ),
            )}
          </div>
          <p><strong>HDRI:</strong></p>
          <div className="asset-credits-links">
            {assetCredits.hdri.map((credit) =>
              credit.sourceUrl ? (
                renderExternalLink(
                  credit.sourceUrl,
                  `${credit.name} - ${credit.author ?? 'Unknown'}`,
                  `hdri-${credit.name}`,
                )
              ) : (
                <p key={`hdri-${credit.name}`}>
                  {credit.name} - {credit.author ?? 'Unknown'}
                  {credit.notes ? ` (${credit.notes})` : ''}
                </p>
              ),
            )}
          </div>
          <p><strong>3D Models:</strong></p>
          <div className="asset-credits-links">
            {assetCredits.models.map((credit) =>
              credit.sourceUrl ? (
                renderExternalLink(
                  credit.sourceUrl,
                  `${credit.name} - ${credit.author ?? 'Unknown'}`,
                  `model-${credit.name}`,
                )
              ) : (
                <p key={`model-${credit.name}`}>
                  {credit.name} - {credit.author ?? 'Unknown'}
                  {credit.notes ? ` (${credit.notes})` : ''}
                </p>
              ),
            )}
          </div>
        </aside>
      ) : null}

      {selectedInfoItem ? (
        <aside className="info-detail-panel">
          <div className="info-detail-topline">
            <span>
              {selectedInfoItem.categoryId} / {selectedInfoItem.subcategoryId}
            </span>
            <button type="button" onClick={() => setSelectedInfoItem(null)}>
              Close
            </button>
          </div>

          <h3>{selectedInfoItem.item.title}</h3>
          <p className="info-summary">{selectedInfoItem.item.summary}</p>
          <p>{selectedInfoItem.item.details}</p>

          {selectedInfoItem.item.links ? (
            <div className="info-links">
              {selectedInfoItem.item.links.repoUrl ? (
                renderExternalLink(
                  selectedInfoItem.item.links.repoUrl,
                  'Repository',
                  'info-repository-link',
                )
              ) : null}
              {selectedInfoItem.item.links.liveUrl ? (
                renderExternalLink(
                  selectedInfoItem.item.links.liveUrl,
                  'Live Demo',
                  'info-live-link',
                )
              ) : null}
              {selectedInfoItem.item.links.externalUrl ? (
                renderExternalLink(
                  selectedInfoItem.item.links.externalUrl,
                  'External Link',
                  'info-external-link',
                )
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}
    </section>
  );
};

export default SpaceShowcase;
