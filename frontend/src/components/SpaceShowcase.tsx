import { useMemo, useState } from 'react';

import assetCreditsJson from '../features/information/data/assetCredits.json';
import { usePandaMonkChatbot } from '../features/chatbot/hooks/usePandaMonkChatbot';
import { sceneInformationCategories } from '../features/information';
import type { CategoryId } from '../features/information/models';
import { useAmbientAudio } from '../features/space/hooks/useAmbientAudio';
import { useSpaceSceneRuntime } from '../features/space/hooks/useSpaceSceneRuntime';
import { useViewportHints } from '../features/space/hooks/useViewportHints';
import AssetCreditsPanel, { type AssetCreditsConfig } from './AssetCreditsPanel';
import ChatPanel from './ChatPanel';
import InfoDetailPanel from './InfoDetailPanel';

const SpaceShowcase = () => {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [subcategoryFilterByCategory, setSubcategoryFilterByCategory] = useState<
    Partial<Record<CategoryId, string>>
  >({});

  const { isMobileViewport, isPortraitViewport } = useViewportHints();
  const { isAudioOn, setIsAudioOn } = useAmbientAudio();
  const {
    containerRef,
    selectedInfoItem,
    setSelectedInfoItem,
    loadingState,
    selectedCategoryLabel,
    avatarAnchor,
    setPandaSpeaking,
    setCategorySubcategoryFilter,
  } = useSpaceSceneRuntime();

  const assetCredits = assetCreditsJson as AssetCreditsConfig;
  const categoriesByModelOrder = useMemo(
    () => [...sceneInformationCategories].sort((a, b) => a.modelIndex - b.modelIndex),
    [],
  );

  const {
    chatPanelStyle,
    isSendingChat,
    chatError,
    chatConversation,
    sendUserMessage,
  } = usePandaMonkChatbot({
    avatarAnchor,
    onNavigateToCategory: (target) => {
      window.portfolioNavigateTo?.(target);
    },
    onPandaSpeakingChange: setPandaSpeaking,
  });

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

      <section className="subcategory-filter-panel" aria-label="Subcategory model filters">
        <p className="subcategory-filter-title">Model Subcategory Filters</p>
        <div className="subcategory-filter-grid">
          {categoriesByModelOrder.map((category) => (
            <label key={category.id} className="subcategory-filter-field">
              <span>{`Model ${category.modelIndex + 1}: ${category.label}`}</span>
              <select
                value={subcategoryFilterByCategory[category.id] ?? ''}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSubcategoryFilterByCategory((prev) => ({
                    ...prev,
                    [category.id]: nextValue,
                  }));
                  setCategorySubcategoryFilter(category.id, nextValue || undefined);
                }}
              >
                <option value="">All subcategories</option>
                {category.subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <ChatPanel
        conversation={chatConversation}
        isSending={isSendingChat}
        error={chatError}
        onSendMessage={sendUserMessage}
        panelStyle={chatPanelStyle}
      />

      <AssetCreditsPanel
        isOpen={isCreditsOpen}
        credits={assetCredits}
        onClose={() => setIsCreditsOpen(false)}
      />

      <InfoDetailPanel
        selectedInfoItem={selectedInfoItem}
        onClose={() => setSelectedInfoItem(null)}
      />
    </section>
  );
};

export default SpaceShowcase;
