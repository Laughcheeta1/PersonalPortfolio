export interface Point { x: number; y: number }
export interface PlaneProjection {
  toLocal(point: Point): Point;
  toViewport(point: Point): Point;
}

/** Invert the projected panel plane, including CSS3D perspective and scaling. */
export function projectPlane(corners: readonly [Point, Point, Point, Point], width: number, height: number): PlaneProjection | null {
  const [p0, p1, p2, p3] = corners;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(determinant) < 1e-8 || width <= 0 || height <= 0) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + h * p3.x;
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + h * p3.y;
  return {
    toLocal({ x, y }) {
      const ax = a - x * g, bx = b - x * h;
      const ay = d - y * g, by = e - y * h;
      const denominator = ax * by - bx * ay;
      return {
        x: ((x - p0.x) * by - bx * (y - p0.y)) / denominator * width,
        y: (ax * (y - p0.y) - (x - p0.x) * ay) / denominator * height,
      };
    },
    toViewport({ x, y }) {
      const u = x / width, v = y / height, denominator = g * u + h * v + 1;
      return { x: (a * u + b * v + p0.x) / denominator, y: (d * u + e * v + p0.y) / denominator };
    },
  };
}

/** Find the visually nearest limb, rather than assuming a projected sphere stays circular. */
export function nearestPlanetLimb(mouse: Point, center: Point, radius: number, projection: PlaneProjection): Point & { angle: number } {
  const step = Math.PI * 2 / 64;
  const pointAt = (angle: number) => ({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  const distanceAt = (angle: number) => {
    const point = projection.toViewport(pointAt(angle));
    return (point.x - mouse.x) ** 2 + (point.y - mouse.y) ** 2;
  };
  let bestAngle = 0, bestDistance = Infinity;
  for (let i = 0; i < 64; i++) {
    const angle = step * i, distance = distanceAt(angle);
    if (distance < bestDistance) { bestDistance = distance; bestAngle = angle; }
  }
  let left = bestAngle - step, right = bestAngle + step;
  for (let i = 0; i < 24; i++) {
    const first = left + (right - left) / 3, second = right - (right - left) / 3;
    if (distanceAt(first) < distanceAt(second)) right = second; else left = first;
  }
  const angle = (left + right) / 2;
  return { ...pointAt(angle), angle: angle * 180 / Math.PI + 90 };
}
