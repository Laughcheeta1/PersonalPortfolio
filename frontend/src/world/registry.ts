import { config } from '../config';
export const landmarks = ([
  { id: 'starship', model: 'rocket', title: 'Beyond the horizon', subtitle: 'SPACE & AMBITION', position: [-14, -13], biome: 'lunar', color: '#8297bf' },
  { id: 'f22', model: 'jet', title: 'Born to explore', subtitle: 'AVIATION & CURIOSITY', position: [-14, 15], biome: 'altitude', color: '#9dcbd9' },
  { id: 'neural-network', model: 'network', title: 'Connecting the dots', subtitle: 'AI & ENGINEERING', position: [7, -13], biome: 'digital', color: '#66c7bc' },
  { id: 'roses', model: 'bouquet', title: 'What matters most', subtitle: 'FAMILY & LOVE', position: [29, 15], biome: 'garden', color: '#ed9da2' },
  { id: 'victory-statue', model: 'statue', title: 'Still standing', subtitle: 'RESILIENCE & GROWTH', position: [7, 15], biome: 'battle', color: '#c4a17c' },
  { id: 'squat-rack', model: 'gym', title: 'A little stronger', subtitle: 'DISCIPLINE & TRAINING', position: [29, -13], biome: 'training', color: '#b2b88a' },
  { id: 'pergamon-library', model: 'library', title: 'Forever a student', subtitle: 'THE LIBRARY · UNDER CONSTRUCTION', position: [-87, -9], biome: 'classical', color: '#ddc890' },
] as const).map(item => ({ ...item, rotation: item.position[1] > 0 ? Math.PI : 0, scale: 1, frontPanel: `${item.id}:front`, backPanel: `${item.id}:back`, navigationNode: `${item.id}:entrance`, proximityRadius: config.panels.activationRadius, collisionRadius: item.model === 'library' ? 6 : 3.2 })) ;
export type LandmarkId = typeof landmarks[number]['id'];
export type Landmark = typeof landmarks[number];
export const isLandmarkId = (value: unknown): value is LandmarkId => typeof value === 'string' && landmarks.some(l => l.id === value);
export interface Biome { innerRadius: number; outerRadius: number; strength: number; sky: string; ground: string; fog: number; light: string; ambient: number; particles: number; audio: number }
const base = { innerRadius: 4, outerRadius: 17, strength: 1, fog: .006, ambient: 2, particles: .6, audio: .2 };
export const biomes: Record<string, Biome> = {
 lunar: { ...base, sky: '#18274f', ground: '#aaaebd', light: '#b4d2ff', fog: .003, ambient: 1.4 },
 altitude: { ...base, sky: '#c2e5f5', ground: '#a6bac0', light: '#e9f7ff', fog: .013 },
 digital: { ...base, sky: '#7eb9cb', ground: '#87b9ab', light: '#adfff0' },
 garden: { ...base, sky: '#f3d7cb', ground: '#b5ce89', light: '#ffe1b9' },
 battle: { ...base, sky: '#c6a48e', ground: '#a89d88', light: '#ffc586', fog: .011 },
 training: { ...base, sky: '#b2d7cd', ground: '#a5b897', light: '#fff2c8' },
 classical: { ...base, innerRadius: 12, outerRadius: 54, sky: '#eadab4', ground: '#cbc795', light: '#ffe6ae', fog: .004 },
};
