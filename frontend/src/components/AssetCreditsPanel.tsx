import { getSafeExternalHref } from '../features/information/urlSafety';
import { useI18n } from '../features/i18n/useI18n';
import styles from './AssetCreditsPanel.module.css';

type AssetCreditItem = {
  name: string;
  author?: string;
  sourceUrl?: string;
  notes?: string;
};

export type AssetCreditsConfig = {
  music: AssetCreditItem[];
  hdri: AssetCreditItem[];
  models: AssetCreditItem[];
};

type AssetCreditsPanelProps = {
  isOpen: boolean;
  credits: AssetCreditsConfig;
  onClose: () => void;
};

function renderExternalLink(
  href: string | undefined,
  children: string,
  key: string,
  className?: string,
) {
  const safeHref = getSafeExternalHref(href);
  if (!safeHref) {
    return null;
  }

  return (
    <a key={key} href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

const AssetCreditsPanel = ({ isOpen, credits, onClose }: AssetCreditsPanelProps) => {
  const { t } = useI18n();

  if (!isOpen) {
    return null;
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.topline}>
        <span>{t('assetCredits.title')}</span>
        <button type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>

      <p><strong>{t('assetCredits.music')}</strong></p>
      <div className={styles.links}>
        {credits.music.map((credit) =>
          credit.sourceUrl ? (
            renderExternalLink(
              credit.sourceUrl,
              `${credit.name} - ${credit.author ?? t('assetCredits.unknownAuthor')}`,
              `music-${credit.name}`,
            )
          ) : (
            <p key={`music-${credit.name}`}>
              {credit.name} - {credit.author ?? t('assetCredits.unknownAuthor')}
              {credit.notes ? ` (${credit.notes})` : ''}
            </p>
          ),
        )}
      </div>

      <p><strong>{t('assetCredits.hdri')}</strong></p>
      <div className={styles.links}>
        {credits.hdri.map((credit) =>
          credit.sourceUrl ? (
            renderExternalLink(
              credit.sourceUrl,
              `${credit.name} - ${credit.author ?? t('assetCredits.unknownAuthor')}`,
              `hdri-${credit.name}`,
            )
          ) : (
            <p key={`hdri-${credit.name}`}>
              {credit.name} - {credit.author ?? t('assetCredits.unknownAuthor')}
              {credit.notes ? ` (${credit.notes})` : ''}
            </p>
          ),
        )}
      </div>

      <p><strong>{t('assetCredits.models')}</strong></p>
      <div className={styles.links}>
        {credits.models.map((credit) =>
          credit.sourceUrl ? (
            renderExternalLink(
              credit.sourceUrl,
              `${credit.name} - ${credit.author ?? t('assetCredits.unknownAuthor')}`,
              `model-${credit.name}`,
            )
          ) : (
            <p key={`model-${credit.name}`}>
              {credit.name} - {credit.author ?? t('assetCredits.unknownAuthor')}
              {credit.notes ? ` (${credit.notes})` : ''}
            </p>
          ),
        )}
      </div>
    </aside>
  );
};

export default AssetCreditsPanel;
