import speakingLoopUrl from '../../assets/audio/the_smoke_decides.mp3';

export type SpeakingAudioController = {
  start: () => void;
  stop: () => void;
};

export function createSpeakingAudioController(): SpeakingAudioController {
  const audio = new Audio(speakingLoopUrl);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.09;

  return {
    start: () => {
      void audio.play().catch(() => {
        // Browser may require user interaction before audio playback.
      });
    },
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
  };
}
