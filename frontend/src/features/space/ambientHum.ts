import trackUrl from '../../assets/audio/the_smoke_decides.mp3';

export type AmbientHumController = {
  ensurePlaying: () => void;
  stop: () => void;
};

export function startAmbientHum(): AmbientHumController {
  const audio = new Audio(trackUrl);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.14;

  const ensurePlaying = () => {
    void audio.play().catch(() => {
      // Chrome may block autoplay until a user gesture. Caller can retry on interaction.
    });
  };

  ensurePlaying();

  return {
    ensurePlaying,
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
  };
}
