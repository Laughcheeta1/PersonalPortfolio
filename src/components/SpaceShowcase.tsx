import { useEffect, useRef, useState } from 'react';

import {
  normalizeNavigationTarget,
  sceneInformationCategories,
  validateSceneCategoryMappings,
} from '../features/information';
import type {
  InformationItemSelection,
  SceneNavigationTarget,
} from '../features/information/models';
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const runtime = new SpaceSceneRuntime({
      container,
      models: SPACE_MODELS,
      categories: sceneInformationCategories,
      onSelectionChange: setSelectedIndex,
      onInfoItemSelectionChange: setSelectedInfoItem,
    });

    const mappingIssues = validateSceneCategoryMappings(SPACE_MODELS.length);
    if (mappingIssues.length > 0) {
      console.warn('[SpaceShowcase] Invalid category/model mappings:', mappingIssues);
    }

    runtimeRef.current = runtime;
    runtime.setCardDesignIndex(0);
    void runtime.start();

    window.portfolioNavigateTo = (target: SceneNavigationTarget) => {
      runtime.navigateTo(normalizeNavigationTarget(target));
    };

    return () => {
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

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [isAudioOn]);

  const selectedName = selectedIndex === null ? '' : SPACE_MODELS[selectedIndex]?.name ?? '';

  return (
    <section className="space-page">
      <div ref={containerRef} className="space-canvas" aria-label="Interactive 3D portfolio scene" />

      <div className={`focus-label ${selectedName ? 'show' : ''}`}>{selectedName}</div>

      <button
        type="button"
        className="ambient-audio-toggle"
        onClick={() => setIsAudioOn((prev) => !prev)}
      >
        {isAudioOn ? 'Music: On' : 'Music: Off'}
      </button>

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
                <a href={selectedInfoItem.item.links.repoUrl} target="_blank" rel="noreferrer">
                  Repository
                </a>
              ) : null}
              {selectedInfoItem.item.links.liveUrl ? (
                <a href={selectedInfoItem.item.links.liveUrl} target="_blank" rel="noreferrer">
                  Live Demo
                </a>
              ) : null}
              {selectedInfoItem.item.links.externalUrl ? (
                <a href={selectedInfoItem.item.links.externalUrl} target="_blank" rel="noreferrer">
                  External Link
                </a>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}
    </section>
  );
};

export default SpaceShowcase;
