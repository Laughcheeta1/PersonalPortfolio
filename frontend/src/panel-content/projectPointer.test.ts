import { describe, expect, it } from 'vitest';
import { nearestPlanetLimb, projectPlane } from './projectPointer';

describe('project cursor coordinates', () => {
  it('removes screen translation and scaling instead of treating screen pixels as panel pixels', () => {
    const projection = projectPlane([{ x: 80, y: 140 }, { x: 380, y: 140 }, { x: 380, y: 290 }, { x: 80, y: 290 }], 600, 300)!;
    expect(projection.toLocal({ x: 230, y: 215 })).toEqual({ x: 300, y: 150 });
    expect(projection.toViewport({ x: 100, y: 80 })).toEqual({ x: 130, y: 180 });
  });

  it('handles a perspective trapezoid, whose center is not its bounding-box center', () => {
    const projection = projectPlane([{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 260, y: 180 }, { x: 140, y: 180 }], 200, 100)!;
    const local = projection.toLocal({ x: 200, y: 150 });
    expect(local.x).toBeCloseTo(100, 8);
    expect(local.y).toBeCloseTo(50, 8);
    const screen = projection.toViewport({ x: 100, y: 50 });
    expect(screen.x).toBeCloseTo(200, 8);
    expect(screen.y).toBeCloseTo(150, 8);
  });

  it('ignores collapsed or hidden planes', () => {
    expect(projectPlane([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], 200, 100)).toBeNull();
  });
});

describe('landed starship', () => {
  it('follows opposite sides of a planet without moving inside its surface', () => {
    const projection = projectPlane([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }], 200, 200)!;
    for (const direction of [-1, 1]) {
      const result = nearestPlanetLimb({ x: 100 + direction * 20, y: 100 }, { x: 100, y: 100 }, 40, projection);
      expect(result.x).toBeCloseTo(100 + direction * 40, 3);
      expect(result.y).toBeCloseTo(100, 3);
      expect(Math.hypot(result.x - 100, result.y - 100)).toBeCloseTo(40, 8);
    }
  });

  it('chooses the visually closest point under perspective, including near the planet center', () => {
    const projection = projectPlane([{ x: 60, y: 40 }, { x: 560, y: 70 }, { x: 450, y: 310 }, { x: 100, y: 290 }], 600, 300)!;
    const center = { x: 290, y: 150 }, radius = 40;
    for (const localMouse of [{ x: 308, y: 166 }, center]) {
      const mouse = projection.toViewport(localMouse);
      const result = nearestPlanetLimb(mouse, center, radius, projection);
      const screen = projection.toViewport(result);
      const distance = Math.hypot(screen.x - mouse.x, screen.y - mouse.y);
      expect(Math.hypot(result.x - center.x, result.y - center.y)).toBeCloseTo(radius, 8);
      for (let i = 0; i < 720; i++) {
        const angle = i * Math.PI / 360;
        const candidate = projection.toViewport({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
        expect(distance).toBeLessThanOrEqual(Math.hypot(candidate.x - mouse.x, candidate.y - mouse.y) + .001);
      }
    }
  });
});
