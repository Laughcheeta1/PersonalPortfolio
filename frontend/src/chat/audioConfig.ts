import type { Landmark } from '../world/registry';

/** Procedural ambience recipes; frequencies in Hz, pulse rates in cycles/second. */
export const ambientSynthesis = {
  noiseInput: .04, noiseMemory: 1.02, noiseGain: 3,
  profiles: {
    altitude: { filter: 1400, noise: 2.4, frequency: 180, tone: .06, pulse: 1, modulation: .6 },
    battle: { filter: 180, noise: 2, frequency: 60, tone: .35, pulse: 2, modulation: .6 },
    classical: { filter: 1100, noise: 1.2, frequency: 440, tone: .2, pulse: 1, modulation: .4 },
  } satisfies Partial<Record<Landmark['biome'], AmbientProfile>>,
};
export interface AmbientProfile {
  filter: number; noise: number; frequency: number; tone: number; pulse: number; modulation: number;
}
