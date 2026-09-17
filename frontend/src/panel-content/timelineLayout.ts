import type { TimelineEntry } from './data';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatTimelineMonth(timestamp: number): string {
  return monthFormatter.format(timestamp);
}

function parseTimelineDate(value: string): number {
  return Date.parse(`${value.length === 7 ? `${value}-01` : value}T00:00:00Z`);
}

interface FlowEdge { to: number; reverse: number; capacity: number }

/** Round half of every interval to one side, keeping every time slice balanced.
 * Forward time edges carry the number of selected intervals currently active;
 * each selected interval closes a cycle with its end-to-start edge. Integral
 * circulation with floor/ceil bounds therefore guarantees a difference <= 1.
 */
function balancedSides(intervals: readonly { startTimestamp: number; endTimestamp: number }[]) {
  const times = [...new Set(intervals.flatMap(entry => [entry.startTimestamp, entry.endTimestamp]))].sort((a, b) => a - b);
  const indices = new Map(times.map((time, index) => [time, index]));
  const source = times.length;
  const sink = source + 1;
  const graph: FlowEdge[][] = Array.from({ length: sink + 1 }, () => []);
  const demand = Array<number>(times.length).fill(0);
  function addEdge(from: number, to: number, capacity: number) {
    const edge = { to, reverse: graph[to].length, capacity };
    graph[from].push(edge);
    graph[to].push({ to: from, reverse: graph[from].length - 1, capacity: 0 });
    return edge;
  }
  const changes = Array<number>(times.length).fill(0);
  const intervalEdges = intervals.map(entry => {
    const from = indices.get(entry.startTimestamp)!;
    const to = indices.get(entry.endTimestamp)!;
    changes[from]++;
    changes[to]--;
    return from === to ? undefined : addEdge(to, from, 1);
  });
  let active = 0;
  for (let index = 0; index < times.length - 1; index++) {
    active += changes[index];
    const lower = Math.floor(active / 2);
    addEdge(index, index + 1, Math.ceil(active / 2) - lower);
    demand[index] -= lower;
    demand[index + 1] += lower;
  }
  let remaining = 0;
  demand.forEach((amount, node) => {
    if (amount > 0) { addEdge(source, node, amount); remaining += amount; }
    else if (amount < 0) addEdge(node, sink, -amount);
  });
  // Edmonds–Karp suffices for a portfolio-sized interval graph and remains polynomial.
  while (remaining > 0) {
    const parents: ({ from: number; edge: FlowEdge } | undefined)[] = Array(graph.length);
    const visited = new Set([source]);
    const queue = [source];
    for (let head = 0; head < queue.length && !visited.has(sink); head++) {
      const from = queue[head];
      for (const edge of graph[from]) {
        if (edge.capacity <= 0 || visited.has(edge.to)) continue;
        visited.add(edge.to);
        parents[edge.to] = { from, edge };
        queue.push(edge.to);
      }
    }
    if (!parents[sink]) throw new Error('Unable to balance timeline intervals');
    let amount = remaining;
    for (let node = sink; node !== source; node = parents[node]!.from) amount = Math.min(amount, parents[node]!.edge.capacity);
    for (let node = sink; node !== source; node = parents[node]!.from) {
      const { edge } = parents[node]!;
      edge.capacity -= amount;
      graph[node][edge.reverse].capacity += amount;
    }
    remaining -= amount;
  }
  return intervalEdges.map((edge, index) => edge ? edge.capacity === 0 ? 'left' as const : 'right' as const : index % 2 ? 'right' as const : 'left' as const);
}

export function buildTimelineLayout(entries: readonly TimelineEntry[], now: Date) {
  const currentMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const parsed = entries.map(entry => ({
    ...entry,
    current: Boolean(entry.current || !entry.end),
    startTimestamp: parseTimelineDate(entry.start),
    endTimestamp: entry.current || !entry.end ? nextMonth : parseTimelineDate(entry.end),
  }));
  const start = Math.min(currentMonth, ...parsed.map(entry => entry.startTimestamp));
  const end = Math.max(nextMonth, ...parsed.map(entry => entry.endTimestamp));
  const span = Math.max(1, end - start);
  parsed.sort((a, b) => a.startTimestamp - b.startTimestamp || a.endTimestamp - b.endTimestamp || a.id.localeCompare(b.id));
  const sides = balancedSides(parsed);
  const laneEnds: Record<'left' | 'right', number[]> = { left: [], right: [] };
  const cards = parsed.map((entry, index) => {
    const side = sides[index];
    const lanes = laneEnds[side];
    const available = lanes.findIndex(laneEnd => laneEnd <= entry.startTimestamp);
    const lane = available < 0 ? lanes.length : available;
    lanes[lane] = entry.endTimestamp;
    return {
      ...entry,
      side,
      lane,
      period: `${formatTimelineMonth(entry.startTimestamp)} — ${entry.current ? 'present' : formatTimelineMonth(entry.endTimestamp)}`,
      top: (end - entry.endTimestamp) / span * 100,
      height: (entry.endTimestamp - entry.startTimestamp) / span * 100,
    };
  });
  return { cards, start, end, currentMonth, laneCount: Math.max(1, laneEnds.left.length, laneEnds.right.length) };
}
