import { getSafeExternalHref } from '../features/information/urlSafety';
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
  if (!selectedInfoItem) {
    return null;
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.topline}>
        <span>
          {selectedInfoItem.categoryId} / {selectedInfoItem.subcategoryId}
        </span>
        <button type="button" onClick={onClose}>
          Close
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
                'Repository',
                'info-repository-link',
              )
            : null}
          {selectedInfoItem.item.links.liveUrl
            ? renderExternalLink(selectedInfoItem.item.links.liveUrl, 'Live Demo', 'info-live-link')
            : null}
          {selectedInfoItem.item.links.externalUrl
            ? renderExternalLink(
                selectedInfoItem.item.links.externalUrl,
                'External Link',
                'info-external-link',
              )
            : null}
        </div>
      ) : null}
    </aside>
  );
};

export default InfoDetailPanel;
