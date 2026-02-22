import { useState } from 'react';

import assetCreditsJson from '../features/information/data/assetCredits.json';
import { usePandaMonkChatbot } from '../features/chatbot/hooks/usePandaMonkChatbot';
import { useI18n } from '../features/i18n/useI18n';
import type { CategoryId } from '../features/information/models';
import { useAmbientAudio } from '../features/space/hooks/useAmbientAudio';
import { useSpaceSceneRuntime } from '../features/space/hooks/useSpaceSceneRuntime';
import { useViewportHints } from '../features/space/hooks/useViewportHints';
import AssetCreditsPanel, { type AssetCreditsConfig } from './AssetCreditsPanel';
import ChatPanel from './ChatPanel';
import InfoDetailPanel from './InfoDetailPanel';

const CARD_HINT_DISMISSED_STORAGE_KEY = 'portfolio.cardHintDismissed.v1';

const SpaceShowcase = () => {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const [isCardHintDismissed, setIsCardHintDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(CARD_HINT_DISMISSED_STORAGE_KEY) === '1';
  });
  const [subcategoryFilterByCategory, setSubcategoryFilterByCategory] = useState<
    Partial<Record<CategoryId, string[]>>
  >({});

  const dismissCardHint = () => {
    setIsCardHintDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_HINT_DISMISSED_STORAGE_KEY, '1');
    }
  };

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
      <div ref={containerRef} className="space-canvas" aria-label={t('space.canvasAria')} />
      <label className="language-picker" aria-label={t('language.label')}>
        <span>{t('language.label')}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as (typeof supportedLocales)[number])}
        >
          {supportedLocales.map((localeOption) => (
            <option key={localeOption} value={localeOption}>
              {t(`language.${localeOption}`)}
            </option>
          ))}
        </select>
      </label>
      {loadingState.active ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-card">
            <p className="loading-title">{t('space.loading.title')}</p>
            <p className="loading-label">{loadingState.label}</p>
            {isMobileViewport ? (
              <p className="loading-mobile-tip">
                {isPortraitViewport
                  ? t('space.loading.mobilePortrait')
                  : t('space.loading.mobileLandscape')}
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
      {selectedCategory && !selectedInfoItem && !isCardHintDismissed ? (
        <div className="card-click-hint" role="status" aria-live="polite">
          <span>{t('space.cardHint.tip')}</span>
          <button
            type="button"
            className="card-click-hint-dismiss"
            aria-label={t('space.cardHint.hideAria')}
            onClick={dismissCardHint}
          >
            {t('space.cardHint.hide')}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="ambient-audio-toggle"
        onClick={() => setIsAudioOn((prev) => !prev)}
      >
        {isAudioOn ? t('space.music.on') : t('space.music.off')}
      </button>

      <button
        type="button"
        className="asset-credits-toggle"
        onClick={() => setIsCreditsOpen((prev) => !prev)}
      >
        {isCreditsOpen ? t('space.sources.hide') : t('space.sources.show')}
      </button>

      {selectedCategory ? (
        <section className="subcategory-filter-panel" aria-label={t('space.subcategoryPanel.aria')}>
          <p className="subcategory-filter-title">
            {t('space.subcategoryPanel.title', { category: selectedCategory.label })}
          </p>
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
