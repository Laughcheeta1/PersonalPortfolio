/** Coherent, deterministic surface fields, sampled directly on the sphere. */
export type PlanetKind = 'earth' | 'lava' | 'ocean' | 'jupiter' | 'saturn' | 'ice' | 'iron' | 'violet' | 'desert' | 'night' | 'emerald' | 'sulfur';
export interface PlanetDesign {
  kind: PlanetKind;
  seed: number;
  atmosphere: string;
  rings?: 'asteroids' | 'ice' | 'dust' | 'double';
  ringColor?: string;
}
export const planetDesigns: readonly PlanetDesign[] = [
  { kind: 'lava', seed: 17, atmosphere: '#ff641f' },
  { kind: 'ocean', seed: 43, atmosphere: '#36bfff' },
  { kind: 'saturn', seed: 81, atmosphere: '#e8c696', rings: 'double', ringColor: '#d4b895' },
  { kind: 'earth', seed: 29, atmosphere: '#5eafff' },
  { kind: 'ice', seed: 62, atmosphere: '#98ecff', rings: 'ice', ringColor: '#b8ecff' },
  { kind: 'jupiter', seed: 137, atmosphere: '#edbe9c' },
  { kind: 'iron', seed: 103, atmosphere: '#8b91a1', rings: 'asteroids', ringColor: '#b8a89b' },
  { kind: 'violet', seed: 211, atmosphere: '#b790ff' },
  { kind: 'desert', seed: 77, atmosphere: '#f5a165' },
  { kind: 'night', seed: 191, atmosphere: '#4d8fdb' },
  { kind: 'emerald', seed: 317, atmosphere: '#55e0b6', rings: 'dust', ringColor: '#bcddba' },
  { kind: 'sulfur', seed: 127, atmosphere: '#f2d75c' },
  { kind: 'ocean', seed: 281, atmosphere: '#39dbef', rings: 'double', ringColor: '#a6ccdd' },
  { kind: 'lava', seed: 419, atmosphere: '#ff3927', rings: 'asteroids', ringColor: '#ae7563' },
  { kind: 'violet', seed: 563, atmosphere: '#e0a3ed', rings: 'ice', ringColor: '#c4b3e6' },
  { kind: 'ice', seed: 659, atmosphere: '#bdfff2' },
];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iy, iz, seed), b = hash(ix + 1, iy, iz, seed), c = hash(ix, iy + 1, iz, seed), d = hash(ix + 1, iy + 1, iz, seed);
  const e = hash(ix, iy, iz + 1, seed), f = hash(ix + 1, iy, iz + 1, seed), g = hash(ix, iy + 1, iz + 1, seed), h = hash(ix + 1, iy + 1, iz + 1, seed);
  return (a + (b - a) * u) * (1 - v) * (1 - w) + (c + (d - c) * u) * v * (1 - w) + (e + (f - e) * u) * (1 - v) * w + (g + (h - g) * u) * v * w;
}
function fbm(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let value = 0, amplitude = 0.55, total = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise(x, y, z, seed + i * 31) * amplitude;
    total += amplitude; amplitude *= 0.48;
    x = x * 2.07 + 7.3; y = y * 2.07 + 3.9; z = z * 2.07 + 5.1;
  }
  return value / total;
}
type Color = readonly [number, number, number];
const mix = (a: Color, b: Color, t: number): Color => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
interface Crater { x: number; y: number; z: number; radius: number }
const craterFields = new Map<number, Crater[]>();
function craters(seed: number): Crater[] {
  let field = craterFields.get(seed);
  if (!field) {
    field = Array.from({ length: 36 }, (_, i) => {
      const y = hash(i, 9, 3, seed) * 2 - 1;
      const angle = hash(i, 5, 8, seed) * Math.PI * 2;
      const radius = Math.sqrt(1 - y * y);
      return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius, radius: 0.035 + hash(i, 1, 7, seed) ** 2 * 0.19 };
    });
    craterFields.set(seed, field);
  }
  return field;
}

export function samplePlanetSurface(kind: PlanetKind, x: number, y: number, z: number, seed: number): { r: number; g: number; b: number; emission: number; cloud: number } {
  const n = fbm(x * 3.8, y * 3.8, z * 3.8, seed);
  const detail = noise(x * 52, y * 52, z * 52, seed + 71);
  let color: Color = [0, 0, 0], emission = 0, cloud = 0;
  if (kind === 'jupiter' || kind === 'saturn' || kind === 'violet' || kind === 'emerald') {
    const warp = fbm(x * 6, y * 9, z * 6, seed + 9, 3);
    const bands = Math.sin(y * (kind === 'saturn' ? 55 : 37) + warp * 11 + n * 5) * 0.5 + 0.5;
    const fineBands = Math.sin(y * 150 + warp * 16) * 0.5 + 0.5;
    const palettes: Record<string, readonly [Color, Color, Color]> = {
      jupiter: [[106, 52, 34], [211, 151, 109], [247, 226, 184]],
      saturn: [[147, 117, 74], [215, 188, 133], [245, 231, 183]],
      violet: [[43, 29, 85], [124, 83, 166], [217, 172, 221]],
      emerald: [[12, 71, 69], [40, 145, 128], [174, 217, 174]],
    };
    const p = palettes[kind];
    color = mix(mix(p[0], p[1], smooth(0.05, 0.65, bands)), p[2], smooth(0.48, 0.97, bands) * (0.65 + fineBands * 0.25));
    // A broad elliptical vortex deforms the bands into concentric storm walls.
    const dx = (x + 0.28) / 0.28, dy = (y - 0.23) / 0.13;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1.5 && z > 0.3) {
      const swirl = Math.sin(distance * 19 + Math.atan2(dy, dx) * 1.5 + warp * 5) * 0.5 + 0.5;
      const storm: Color = kind === 'jupiter' ? [188, 86, 50] : kind === 'violet' ? [220, 159, 239] : p[2];
      color = mix(color, mix(p[0], storm, 0.45 + swirl * 0.55), (1 - smooth(0.75, 1.5, distance)) * 0.85);
    }
  } else if (kind === 'lava') {
    const plates = fbm(x * 8, y * 8, z * 8, seed + 4);
    const fissures = 1 - smooth(0.012, 0.06, Math.abs(plates - 0.5));
    const seas = smooth(0.57, 0.68, n);
    emission = Math.max(fissures * 0.86, seas);
    color = mix([17, 18, 23], [75, 45, 36], n * 0.7 + detail * 0.3);
    color = mix(color, mix([226, 48, 6], [255, 210, 73], emission ** 3), emission);
  } else if (kind === 'ocean') {
    color = mix([4, 23, 66], [12, 116, 154], smooth(0.26, 0.8, n));
    const wisps = fbm(x * 9 + n * 3, y * 6, z * 9, seed + 149, 3);
    cloud = smooth(0.54, 0.74, wisps) * 0.86;
    color = mix(color, [215, 239, 249], cloud);
  } else if (kind === 'earth' || kind === 'night') {
    const land = smooth(0.47, 0.515, n);
    const latitude = Math.abs(y);
    const dry = smooth(0.2, 0.45, latitude) * (1 - smooth(0.45, 0.65, latitude));
    const terrain = mix(mix([30, 82, 49], [113, 133, 67], detail * 0.6), [183, 151, 94], dry * smooth(0.48, 0.67, n));
    color = mix(mix([5, 29, 78], [16, 100, 139], smooth(0.37, 0.49, n)), terrain, land);
    color = mix(color, [222, 237, 230], smooth(0.79, 0.96, latitude + (n - 0.5) * 0.24));
    cloud = smooth(0.57, 0.75, fbm(x * 7 + n * 2, y * 5, z * 7, seed + 83, 3)) * 0.8;
    color = mix(color, [237, 244, 247], cloud);
    if (kind === 'night') {
      color = mix([3, 9, 26], color, 0.38);
      const towns = smooth(0.74, 0.92, detail) * land * (1 - cloud) * (1 - smooth(0.59, 0.67, n));
      emission = towns * 0.8;
      color = mix(color, [255, 193, 87], towns);
    }
  } else if (kind === 'ice') {
    const fractures = 1 - smooth(0.009, 0.04, Math.abs(fbm(x * 10 + n, y * 10, z * 10, seed + 41, 3) - 0.5));
    color = mix([57, 138, 158], [211, 236, 230], smooth(0.26, 0.68, n));
    color = mix(color, [18, 83, 113], fractures * 0.72);
    color = mix(color, [240, 249, 241], smooth(0.65, 0.85, detail) * 0.2);
  } else if (kind === 'iron') {
    let relief = 0;
    for (const crater of craters(seed)) {
      const distanceSquared = (x - crater.x) ** 2 + (y - crater.y) ** 2 + (z - crater.z) ** 2;
      if (distanceSquared > crater.radius * crater.radius * 1.6) continue;
      const distance = Math.sqrt(distanceSquared) / crater.radius;
      relief += -0.3 * (1 - smooth(0.2, 0.88, distance)) + 0.32 * Math.exp(-(((distance - 0.96) * 11) ** 2));
      relief += (x - crater.x) / crater.radius * 0.12 * (1 - smooth(0.8, 1.2, distance));
    }
    color = mix([45, 46, 51], [171, 164, 153], clamp(n * 0.9 + detail * 0.14 + relief));
  } else if (kind === 'desert') {
    const strata = Math.sin((y + n * 0.24) * 105) * 0.5 + 0.5;
    color = mix([98, 43, 27], [214, 143, 86], smooth(0.24, 0.76, n));
    color = mix(color, [231, 180, 120], strata * 0.12);
    const canyon = 1 - smooth(0.008, 0.04, Math.abs(n - 0.47));
    color = mix(color, [78, 35, 26], canyon * 0.58);
    color = mix(color, [222, 200, 161], smooth(0.9, 0.99, Math.abs(y) + n * 0.04));
  } else {
    color = mix([123, 73, 20], [233, 197, 74], smooth(0.25, 0.68, n));
    const sulfur = smooth(0.48, 0.63, fbm(x * 13, y * 13, z * 13, seed + 211, 3));
    color = mix(color, [64, 47, 34], sulfur * 0.78);
    color = mix(color, [251, 227, 141], detail * 0.14);
  }
  const grain = 0.94 + detail * 0.12;
  return { r: Math.min(255, color[0] * grain), g: Math.min(255, color[1] * grain), b: Math.min(255, color[2] * grain), emission, cloud };
}
