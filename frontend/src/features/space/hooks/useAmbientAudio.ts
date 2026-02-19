import { useEffect, useRef, useState } from 'react';

import { startAmbientHum, type AmbientHumController } from '../ambientHum';

export function useAmbientAudio() {
  const [isAudioOn, setIsAudioOn] = useState(true);
  const humRef = useRef<AmbientHumController | null>(null);

  useEffect(() => {
    if (!isAudioOn) {
      humRef.current?.stop();
      humRef.current = null;
      return;
    }

    humRef.current = startAmbientHum();

    return () => {
      humRef.current?.stop();
      humRef.current = null;
    };
  }, [isAudioOn]);

  useEffect(() => {
    const unlockAudio = () => {
      if (!isAudioOn) {
        return;
      }
      humRef.current?.ensurePlaying();
    };

    const passiveOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('pointerdown', unlockAudio, passiveOptions);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, passiveOptions);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio, passiveOptions);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio, passiveOptions);
    };
  }, [isAudioOn]);

  return {
    isAudioOn,
    setIsAudioOn,
  };
}
