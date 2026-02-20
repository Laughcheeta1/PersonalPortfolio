import { type CSSProperties, useMemo } from 'react';

import type { AvatarScreenAnchor } from '../models';

type UsePandaMonkChatboxLayoutParams = {
  avatarAnchor: AvatarScreenAnchor;
};

export function usePandaMonkChatboxLayout(
  params: UsePandaMonkChatboxLayoutParams,
): CSSProperties | undefined {
  const { avatarAnchor } = params;

  return useMemo(() => {
    if (typeof window === 'undefined' || !avatarAnchor.visible) {
      return undefined;
    }

    const panelWidth = Math.min(384, Math.max(window.innerWidth - 96, 256));
    const minLeft = 12;
    const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 12);
    const left = Math.min(Math.max(avatarAnchor.x - panelWidth * 0.5, minLeft), maxLeft);
    const top = Math.max(12, Math.min(avatarAnchor.y + 96, window.innerHeight - 260));

    return { left: `${left}px`, top: `${top}px`, bottom: 'auto' };
  }, [avatarAnchor]);
}
