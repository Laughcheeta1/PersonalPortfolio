import trackUrl from '../../assets/audio/the_smoke_decides.mp3';

export type AmbientHumController = {
  stop: () => void;
};

export function startAmbientHum(): AmbientHumController {
  const audio = new Audio(trackUrl);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.14;

  void audio.play().catch(() => {
    // Some browsers can still block playback depending on gesture timing.
  });

  return {
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
  };
}
