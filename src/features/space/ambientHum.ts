export type AmbientHumController = {
  stop: () => void;
};

export function startAmbientHum(): AmbientHumController {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 52;

  filter.type = 'lowpass';
  filter.frequency.value = 180;
  filter.Q.value = 0.6;

  gain.gain.value = 0.018;

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start();

  return {
    stop: () => {
      oscillator.stop();
      void context.close();
    },
  };
}
