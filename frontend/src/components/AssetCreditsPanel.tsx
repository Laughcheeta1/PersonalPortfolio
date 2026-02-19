import { getSafeExternalHref } from '../features/information/urlSafety';
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
  if (!isOpen) {
    return null;
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.topline}>
        <span>Asset Credits</span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <p><strong>Music:</strong></p>
      <div className={styles.links}>
        {credits.music.map((credit) =>
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
      <div className={styles.links}>
        {credits.hdri.map((credit) =>
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
      <div className={styles.links}>
        {credits.models.map((credit) =>
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
  );
};

export default AssetCreditsPanel;
