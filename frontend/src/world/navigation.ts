import { landmarks } from './registry';
import { config } from '../config';
export type Point = { x: number; z: number };
export type Obstacle = Point & { radius: number };
export const roadZ = (x: number) => Math.sin(x * config.navigation.curveFrequency) * config.navigation.curveAmplitude;
/** A title appears only inside the circle spanning its landmark-to-main-road path. */
export const landmarkLabelRadius = (landmark: typeof landmarks[number]) => Math.abs(landmark.position[1]-roadZ(landmark.position[0]))*config.ui.labelRadiusMultiplier;
export const roadStations = [config.navigation.roadStart, config.navigation.roadEnd];
export const entrance = (landmark: typeof landmarks[number]): Point => ({ x: landmark.position[0], z: landmark.position[1] + (landmark.position[1] < 0 ? 1 : -1) * Math.max(config.navigation.entranceOffset, landmark.collisionRadius + config.navigation.entranceClearance) });
export interface NavNode extends Point { id: string; neighbors: string[] }
export const navigation: NavNode[] = [];
// Road samples are graph nodes, so rendered curves and route following agree.
for (let x = roadStations[0]; x <= roadStations.at(-1)!; x += 1) {
  const id = `road:${x}`;
  navigation.push({ id, x, z: roadZ(x), neighbors: [...(x > roadStations[0] ? [`road:${x - 1}`] : []), ...(x < roadStations.at(-1)! ? [`road:${x + 1}`] : [])] });
}
for (const landmark of landmarks) {
  const road = navigation.find(node => node.id === `road:${landmark.position[0]}`)!;
  road.neighbors.push(landmark.navigationNode);
  navigation.push({ id: landmark.navigationNode, ...entrance(landmark), neighbors: [road.id] });
}
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function shortestPath(start: string, end: string, graph = navigation): Point[] {
  const nodes = new Map(graph.map(node => [node.id, node]));
  if (!nodes.has(start) || !nodes.has(end)) return [];
  const costs = new Map<string, number>([[start, 0]]), previous = new Map<string, string>(), open = new Set([start]);
  while (open.size) {
    const current = [...open].reduce((a, b) => costs.get(a)! < costs.get(b)! ? a : b);
    open.delete(current);
    if (current === end) {
      const route = [nodes.get(end)!]; let id = end;
      while (previous.has(id)) { id = previous.get(id)!; route.unshift(nodes.get(id)!); }
      return route.map(({ x, z }) => ({ x, z }));
    }
    for (const neighbor of nodes.get(current)!.neighbors) {
      const next = nodes.get(neighbor); if (!next) continue;
      const cost = costs.get(current)! + distance(nodes.get(current)!, next);
      if (cost < (costs.get(neighbor) ?? Infinity)) { costs.set(neighbor, cost); previous.set(neighbor, current); open.add(neighbor); }
    }
  }
  return [];
}
export function segmentClear(a: Point, b: Point, obstacles: Obstacle[], padding: number): boolean {
  const dx = b.x - a.x, dz = b.z - a.z, length = dx * dx + dz * dz;
  return obstacles.every(o => {
    const t = length ? Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / length)) : 0;
    return Math.hypot(a.x + t * dx - o.x, a.z + t * dz - o.z) >= o.radius + padding;
  });
}
/** Visibility graph around obstacle rings provides a collision-free road entry. */
export function localRoute(start: Point, goal: Point, obstacles: Obstacle[], padding: number): Point[] {
  if (segmentClear(start, goal, obstacles, padding)) return [goal];
  const dx=goal.x-start.x,dz=goal.z-start.z,lengthSq=dx*dx+dz*dz;
  const nearby = obstacles.filter(o => {
    const t=lengthSq?Math.max(0,Math.min(1,((o.x-start.x)*dx+(o.z-start.z)*dz)/lengthSq)):0;
    return Math.hypot(start.x+t*dx-o.x,start.z+t*dz-o.z)<o.radius+padding+config.navigation.obstacleSearchMargin;
  });
  const candidates: Point[] = [start, goal];
  for (const obstacle of nearby) for (let i = 0; i < config.navigation.avoidanceSamples; i++) {
    const angle = i * Math.PI * 2 / config.navigation.avoidanceSamples, radius = (obstacle.radius + padding + config.navigation.avoidancePadding) / Math.cos(Math.PI / config.navigation.avoidanceSamples);
    const p = { x: obstacle.x + Math.cos(angle) * radius, z: obstacle.z + Math.sin(angle) * radius };
    if (segmentClear(p, p, obstacles, padding)) candidates.push(p);
  }
  const graph = candidates.map((p, i) => ({ ...p, id: String(i), neighbors: [] as string[] }));
  for (let i = 0; i < graph.length; i++) for (let j = i + 1; j < graph.length; j++) if (segmentClear(graph[i], graph[j], obstacles, padding)) { graph[i].neighbors.push(String(j)); graph[j].neighbors.push(String(i)); }
  return shortestPath('0', '1', graph).slice(1);
}
export function guidedRoute(start: Point, destination: string, obstacles: Obstacle[], padding: number): Point[] {
  for (const node of [...navigation].sort((a, b) => distance(a, start) - distance(b, start))) {
    const approach = localRoute(start, node, obstacles, padding);
    if (approach.length) return [...approach, ...shortestPath(node.id, destination).slice(1)];
  }
  return [];
}
