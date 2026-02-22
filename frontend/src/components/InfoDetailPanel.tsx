import { getSafeExternalHref } from '../features/information/urlSafety';
import { useI18n } from '../features/i18n/useI18n';
import { CATEGORY_KEY_BY_ID, SUBCATEGORY_KEY_BY_ID } from '../features/information/i18nKeys';
import type { InformationItemSelection } from '../features/information/models';
import styles from './InfoDetailPanel.module.css';

type InfoDetailPanelProps = {
  selectedInfoItem: InformationItemSelection | null;
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

const InfoDetailPanel = ({ selectedInfoItem, onClose }: InfoDetailPanelProps) => {
  const { t } = useI18n();

  if (!selectedInfoItem) {
    return null;
  }

  const isEnhanced = selectedInfoItem.item.enhanced === true;
  const categoryLabel = t(CATEGORY_KEY_BY_ID[selectedInfoItem.categoryId] ?? selectedInfoItem.categoryId);
  const subcategoryLabel = t(
    SUBCATEGORY_KEY_BY_ID[selectedInfoItem.subcategoryId] ?? selectedInfoItem.subcategoryId,
  );

  return (
    <aside className={`${styles.panel} ${isEnhanced ? styles.panelEnhanced : ''}`}>
      <div className={styles.topline}>
        <span>
          {categoryLabel} / {subcategoryLabel}
        </span>
        <button type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>

      <h3>{selectedInfoItem.item.title}</h3>
      <p className={styles.summary}>{selectedInfoItem.item.summary}</p>
      <p>{selectedInfoItem.item.details}</p>

      {selectedInfoItem.item.links ? (
        <div className={styles.links}>
          {selectedInfoItem.item.links.repoUrl
            ? renderExternalLink(
                selectedInfoItem.item.links.repoUrl,
                t('info.link.repository'),
                'info-repository-link',
              )
            : null}
          {selectedInfoItem.item.links.liveUrl
            ? renderExternalLink(
                selectedInfoItem.item.links.liveUrl,
                t('info.link.liveDemo'),
                'info-live-link',
              )
            : null}
          {selectedInfoItem.item.links.externalUrl
            ? renderExternalLink(
                selectedInfoItem.item.links.externalUrl,
                t('info.link.external'),
                'info-external-link',
              )
            : null}
        </div>
      ) : null}
    </aside>
  );
};

export default InfoDetailPanel;
