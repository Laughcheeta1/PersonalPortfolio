import { landmarks } from '../world/registry';

export type PanelSide = 'front' | 'back';

export interface PanelDocument {
  url: string;
  title: string;
}

/**
 * Every notebook surface is a standalone document served by the backend.
 * Keeping the URL convention next to the landmark registry makes the panel
 * contract explicit without putting presentation HTML in TypeScript.
 */
export function panelDocumentFor(panelId: string): PanelDocument | undefined {
  const separator = panelId.lastIndexOf(':');
  if (separator < 1) return undefined;

  const landmarkId = panelId.slice(0, separator);
  const side = panelId.slice(separator + 1) as PanelSide;
  const landmark = landmarks.find(item => item.id === landmarkId);
  if (!landmark || (side !== 'front' && side !== 'back')) return undefined;

  return {
    url: `/panels/${encodeURIComponent(panelId)}`,
    title: `${landmark.title} ${side} notebook`,
  };
}
