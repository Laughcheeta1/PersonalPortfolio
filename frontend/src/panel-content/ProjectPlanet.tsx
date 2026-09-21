import { useEffect, useRef } from 'react';
import { planetDesigns, samplePlanetSurface, type PlanetDesign } from './planetSurfaces';

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 88;
const renderedPlanets = new Map<number, HTMLCanvasElement>();
const clamp = (value: number) => Math.max(0, Math.min(255, value));
const color = (hex: string) => {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [value >> 16 & 255, value >> 8 & 255, value & 255];
};
function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/** The sign of ring depth splits the geometry around the opaque globe. */
function paintRings(ctx: CanvasRenderingContext2D, design: PlanetDesign, front: boolean) {
  if (!design.rings) return;
  const rng = random(design.seed * 7919 + 41);
  const rgb = color(design.ringColor ?? '#c9b49c');
  const asteroid = design.rings === 'asteroids';
  const systems = design.rings === 'double' ? 2 : 1;
  for (let system = 0; system < systems; system++) {
    const angle = system ? .68 : -.38;
    const flatten = system ? .42 : .36;
    const project = (radius: number, theta: number) => {
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta) * flatten;
      return [CENTER + x * Math.cos(angle) - y * Math.sin(angle), CENTER + x * Math.sin(angle) + y * Math.cos(angle)];
    };
    if (asteroid) {
      for (let i = 0; i < 1150; i++) {
        const belt = i % 3;
        const radius = 108 + belt * 17 + (rng() - .5) * (belt === 1 ? 7 : 10);
        const theta = rng() * Math.PI * 2;
        const rockSize = .38 + Math.pow(rng(), 3) * 2.3;
        const brightness = .45 + rng() * .6;
        const irregularity = rng();
        if ((Math.sin(theta) >= 0) !== front) continue;
        const [x, y] = project(radius, theta);
        ctx.fillStyle = `rgb(${rgb.map(c => clamp(c * brightness)).join(',')})`;
        ctx.beginPath();
        for (let point = 0; point < 5; point++) {
          const a = point / 5 * Math.PI * 2;
          const r = rockSize * (.7 + .3 * Math.sin(point * 7 + irregularity * 8));
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        if (rockSize > 1.3) {
          ctx.fillStyle = 'rgba(245,237,221,.55)';
          ctx.fillRect(x - rockSize * .3, y - rockSize * .4, rockSize * .55, .6);
        }
      }
    } else {
      for (let i = 0; i < 100; i++) {
        const radius = 104 + i * .44;
        if ((i > 43 && i < 51) || (i > 78 && i < 82)) continue;
        const brightness = .55 + rng() * .45;
        ctx.strokeStyle = `rgba(${rgb.map(c => clamp(c * brightness)).join(',')},${.18 + rng() * .5})`;
        ctx.lineWidth = .48;
        ctx.beginPath();
        for (let p = 0; p <= 110; p++) {
          const theta = (front ? 0 : Math.PI) + p / 110 * Math.PI;
          const [x, y] = project(radius, theta);
          if (!p) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
}

function renderPlanet(index: number) {
  const cached = renderedPlanets.get(index);
  if (cached) return cached;
  const design = planetDesigns[index];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const atmosphere = color(design.atmosphere);
  const halo = ctx.createRadialGradient(CENTER, CENTER, RADIUS - 1, CENTER, CENTER, RADIUS + 18);
  halo.addColorStop(0, `rgba(${atmosphere.join(',')},.38)`);
  halo.addColorStop(.24, `rgba(${atmosphere.join(',')},.12)`);
  halo.addColorStop(1, `rgba(${atmosphere.join(',')},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);
  paintRings(ctx, design, false);
  const globe = document.createElement('canvas');
  globe.width = globe.height = RADIUS * 2 + 2;
  const globeCtx = globe.getContext('2d');
  if (!globeCtx) return canvas;
  const image = globeCtx.createImageData(globe.width, globe.height);
  const lightLength = Math.hypot(-.5, -.38, .78);
  const light = [-.5 / lightLength, -.38 / lightLength, .78 / lightLength];
  for (let py = 0; py < globe.height; py++) {
    for (let px = 0; px < globe.width; px++) {
      const x = (px - RADIUS - .5) / RADIUS;
      const y = (py - RADIUS - .5) / RADIUS;
      const distance = x * x + y * y;
      if (distance > 1) continue;
      const z = Math.sqrt(1 - distance);
      const sample = samplePlanetSurface(design.kind, x, y, z, design.seed);
      const diffuse = x * light[0] + y * light[1] + z * light[2];
      const illumination = .035 + Math.max(0, diffuse) * .97;
      const rim = Math.pow(1 - z, 3.5) * Math.max(.06, diffuse + .35) * .62;
      const specular = Math.pow(Math.max(0, x * -.265 + y * -.201 + z * .943), 62);
      const water = /water|ocean|earth|archipelago/.test(design.kind);
      const shine = water ? specular * 115 * (1 - sample.cloud) : specular * 9;
      const offset = (py * globe.width + px) * 4;
      const emission = sample.emission * (1.15 - Math.max(0, diffuse) * .45);
      [sample.r, sample.g, sample.b].forEach((channel, i) => {
        image.data[offset + i] = clamp(channel * illumination + atmosphere[i] * rim + shine + channel * emission);
      });
      image.data[offset + 3] = Math.min(1, (1 - Math.sqrt(distance)) * RADIUS + .35) * 255;
    }
  }
  globeCtx.putImageData(image, 0, 0);
  ctx.drawImage(globe, CENTER - RADIUS - 1, CENTER - RADIUS - 1);
  paintRings(ctx, design, true);
  renderedPlanets.set(index, canvas);
  return canvas;
}

/** A cached, lazily shaded sphere; no textures, assets, or animation loop. */
export function ProjectPlanet({ designIndex }: { designIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    const index = ((designIndex % planetDesigns.length) + planetDesigns.length) % planetDesigns.length;
    const paint = () => {
      if (disposed) return;
      canvas.getContext('2d')?.drawImage(renderPlanet(index), 0, 0);
    };
    const schedule = () => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(paint, { timeout: 350 });
      else timer = setTimeout(paint, 0);
    };
    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer?.disconnect();
          schedule();
        }
      }, { rootMargin: '120px' });
      observer.observe(canvas);
    } else schedule();
    return () => {
      disposed = true;
      observer?.disconnect();
      if (timer !== undefined) clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [designIndex]);
  return <canvas ref={canvasRef} className="project-planet__art" width={SIZE} height={SIZE} aria-hidden="true" />;
}
