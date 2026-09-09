import type { Landmark } from '../world/registry';

/** Procedural ambience recipes; frequencies in Hz, pulse rates in cycles/second. */
export const ambientSynthesis = {
  noiseInput: .04, noiseMemory: 1.02, noiseGain: 3,
  lunarSurfAttenuation: .85,
  profiles: {
    lunar: { filter: 210, noise: .25, frequency: 110, tone: .38, pulse: 1, modulation: .25 },
    altitude: { filter: 1400, noise: 2.4, frequency: 180, tone: .06, pulse: 1, modulation: .6 },
    digital: { filter: 700, noise: .15, frequency: 660, tone: .28, pulse: 4, modulation: .85 },
    garden: { filter: 1800, noise: .65, frequency: 1320, tone: .14, pulse: 3, modulation: .95 },
    battle: { filter: 180, noise: 2, frequency: 60, tone: .35, pulse: 2, modulation: .6 },
    training: { filter: 450, noise: .6, frequency: 90, tone: .48, pulse: 2, modulation: .9 },
    classical: { filter: 1100, noise: 1.2, frequency: 440, tone: .2, pulse: 1, modulation: .4 },
  } satisfies Record<Landmark['biome'], AmbientProfile>,
};
export interface AmbientProfile {
  filter: number; noise: number; frequency: number; tone: number; pulse: number; modulation: number;
}
