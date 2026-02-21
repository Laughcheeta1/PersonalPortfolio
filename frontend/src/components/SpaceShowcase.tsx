import { useState } from 'react';

import assetCreditsJson from '../features/information/data/assetCredits.json';
import { usePandaMonkChatbot } from '../features/chatbot/hooks/usePandaMonkChatbot';
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
    Partial<Record<CategoryId, string[]>>
  >({});

  const { isMobileViewport, isPortraitViewport } = useViewportHints();
  const { isAudioOn, setIsAudioOn } = useAmbientAudio();
  const {
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
  } = useSpaceSceneRuntime();

  const assetCredits = assetCreditsJson as AssetCreditsConfig;
  const selectedSubcategoryFilter = selectedCategory
    ? subcategoryFilterByCategory[selectedCategory.id]
    : undefined;

  const {
    chatPanelStyle,
    isSendingChat,
    isAwaitingChatResponse,
    chatError,
    chatConversation,
    sendUserMessage,
  } = usePandaMonkChatbot({
    avatarAnchor,
    onNavigateToCategory: (target) => {
      window.portfolioNavigateTo?.(target);
    },
    onNavigateToMainPage: deselectModel,
    onPandaStateChange: setPandaState,
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

      {selectedCategory ? (
        <section className="subcategory-filter-panel" aria-label="Selected model subcategory filters">
          <p className="subcategory-filter-title">{`${selectedCategory.label} Subcategories`}</p>
          <div className="subcategory-filter-grid">
            {selectedCategory.subcategories.map((subcategory) => {
              const checked =
                selectedSubcategoryFilter === undefined ||
                selectedSubcategoryFilter.includes(subcategory.id);

              return (
                <label key={subcategory.id} className="subcategory-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const allIds = selectedCategory.subcategories.map((entry) => entry.id);
                      const current = new Set(selectedSubcategoryFilter ?? allIds);
                      if (current.has(subcategory.id)) {
                        current.delete(subcategory.id);
                      } else {
                        current.add(subcategory.id);
                      }

                      const nextSelectedIds = allIds.filter((id) => current.has(id));
                      const nextFilter =
                        nextSelectedIds.length === allIds.length ? undefined : nextSelectedIds;

                      setSubcategoryFilterByCategory((prev) => ({
                        ...prev,
                        [selectedCategory.id]: nextFilter,
                      }));
                      setCategorySubcategoryFilter(selectedCategory.id, nextFilter);
                    }}
                  />
                  <span>{subcategory.label}</span>
                </label>
              );
            })}
          </div>
        </section>
      ) : null}

      <ChatPanel
        conversation={chatConversation}
        isSending={isSendingChat}
        isAwaitingResponse={isAwaitingChatResponse}
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
