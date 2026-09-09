import type { PanelDefinition } from '../services';
import type { Landmark } from '../world/registry';

/** Optional portfolio content overrides; omitted sides use the localized demo.
 * Keys are model names from the canonical registry. Overrides apply to all locales.
 * Use real DOM HTML, an HTTPS sandboxed iframe, or { type: 'none' }.
 */
export const panelContent: Partial<Record<Landmark['model'], { front?: PanelDefinition; back?: PanelDefinition }>> = {};
