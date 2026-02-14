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
import { CARD_DESIGN_COUNT, CARD_DESIGN_OPTIONS } from '../features/space/InfoCard3D';
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
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [cardDesignIndex, setCardDesignIndex] = useState(() => {
    const defaultStyle = CARD_DESIGN_OPTIONS.find((entry) => entry.id === 'comic-pop-2');
    return defaultStyle?.index ?? 0;
  });

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
    runtimeRef.current?.setCardDesignIndex(cardDesignIndex);
  }, [cardDesignIndex]);

  const selectedName = selectedIndex === null ? '' : SPACE_MODELS[selectedIndex]?.name ?? '';
  const selectedCardDesignLabel = CARD_DESIGN_OPTIONS[cardDesignIndex]?.label ?? 'Unknown';
  const selectedCardDesignFamily = CARD_DESIGN_OPTIONS[cardDesignIndex]?.family ?? '';

  return (
    <section className="space-page">
      <div ref={containerRef} className="space-canvas" aria-label="Interactive 3D portfolio scene" />

      <div className="space-hud">
        <h1>3D Portfolio Ring</h1>
        <p>Drag to orbit, click a model to focus, click a card to open full details.</p>

        <div className="space-controls">
          <button type="button" onClick={() => setIsAudioOn((prev) => !prev)}>
            {isAudioOn ? 'Disable ambient hum' : 'Enable ambient hum'}
          </button>
          <button type="button" onClick={() => runtimeRef.current?.setSelection(null)}>
            Reset camera focus
          </button>
          <button
            type="button"
            onClick={() =>
              runtimeRef.current?.navigateTo({
                categoryId: 'work',
                subcategoryId: 'companies',
              })
            }
          >
            Jump to Work
          </button>
        </div>

        <div className="card-design-picker" aria-label="Temporary card design selector">
          <span>
            Card Design ({cardDesignIndex + 1}/{CARD_DESIGN_COUNT}): {selectedCardDesignLabel}
            {selectedCardDesignFamily ? ` - ${selectedCardDesignFamily}` : ''}
          </span>
          <div className="card-design-buttons">
            <button
              type="button"
              onClick={() =>
                setCardDesignIndex((prev) => (prev - 1 + CARD_DESIGN_COUNT) % CARD_DESIGN_COUNT)
              }
            >
              Previous style
            </button>
            <button
              type="button"
              onClick={() => setCardDesignIndex((prev) => (prev + 1) % CARD_DESIGN_COUNT)}
            >
              Next style
            </button>
            <select
              aria-label="Select card style"
              value={cardDesignIndex}
              onChange={(event) => setCardDesignIndex(Number(event.target.value))}
            >
              {CARD_DESIGN_OPTIONS.map((design) => (
                <option key={`card-design-${design.id}`} value={design.index}>
                  {design.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={`focus-label ${selectedName ? 'show' : ''}`}>{selectedName}</div>

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
