import { useEffect, useState } from 'react';

export function useViewportHints() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isPortraitViewport, setIsPortraitViewport] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    const syncViewportHints = () => {
      setIsMobileViewport(mobileQuery.matches);
      setIsPortraitViewport(portraitQuery.matches);
    };

    syncViewportHints();
    mobileQuery.addEventListener('change', syncViewportHints);
    portraitQuery.addEventListener('change', syncViewportHints);

    return () => {
      mobileQuery.removeEventListener('change', syncViewportHints);
      portraitQuery.removeEventListener('change', syncViewportHints);
    };
  }, []);

  return {
    isMobileViewport,
    isPortraitViewport,
  };
}
