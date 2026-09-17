import { describe, expect, it } from 'vitest';
import { buildTimelineLayout, formatTimelineMonth } from './timelineLayout';
import { workTimeline, type TimelineEntry } from './data';

const now = new Date('2026-09-16T12:00:00Z');

describe('experience timeline layout', () => {
  function checkIntervals(entries: TimelineEntry[]) {
    const layout = buildTimelineLayout(entries, now);
    const { cards, laneCount } = layout;
    expect(cards).toHaveLength(entries.length);
    expect(new Set(cards.map(card => card.id)).size).toBe(entries.length);
    const boundaries = [...new Set(cards.flatMap(card => [card.startTimestamp, card.endTimestamp]))].sort((a, b) => a - b);
    for (let index = 0; index < boundaries.length - 1; index++) {
      const time = (boundaries[index] + boundaries[index + 1]) / 2;
      const active = cards.filter(card => card.startTimestamp <= time && card.endTimestamp > time);
      const left = active.filter(card => card.side === 'left');
      const right = active.filter(card => card.side === 'right');
      expect(Math.abs(left.length - right.length)).toBeLessThanOrEqual(1);
      for (const side of [left, right]) expect(new Set(side.map(card => card.lane)).size).toBe(side.length);
    }
    for (const card of cards) {
      expect(card.lane).toBeLessThan(laneCount);
      expect(card.top).toBeCloseTo((layout.end - card.endTimestamp) / (layout.end - layout.start) * 100);
      expect(card.top + card.height).toBeCloseTo((layout.end - card.startTimestamp) / (layout.end - layout.start) * 100);
    }
    return layout;
  }

  it('balances concurrent intervals even when alternating starts would stack one side', () => {
    const entries = [[0, 12], [1, 2], [3, 12], [4, 5], [6, 12], [7, 8]].map(([start, end], index) => ({
      ...workTimeline[0], id: `role-${index}`, start: new Date(Date.UTC(2024, start, 1)).toISOString().slice(0, 10),
      end: new Date(Date.UTC(2024, end, 1)).toISOString().slice(0, 10), current: false,
    }));
    checkIntervals(entries);
    expect(buildTimelineLayout([...entries].reverse(), now)).toEqual(buildTimelineLayout(entries, now));
  });

  it('dynamically places additions, nested intervals, shared boundaries, and staggered dates', () => {
    let seed = 31;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed; };
    for (let count = 1; count <= 80; count++) {
      const entries = Array.from({ length: count }, (_, index) => {
        const start = random() % 48;
        const end = start + 1 + random() % 24;
        return {
          ...workTimeline[0], id: `role-${index}`, start: new Date(Date.UTC(2020, start, 1)).toISOString().slice(0, 10),
          end: new Date(Date.UTC(2020, end, 1)).toISOString().slice(0, 10), current: false,
        };
      });
      checkIntervals(entries);
    }
    checkIntervals([...workTimeline]);
  });

  it('advances the current month and active duration while preserving ended roles', () => {
    const september = buildTimelineLayout(workTimeline, now);
    const october = buildTimelineLayout(workTimeline, new Date('2026-10-01T00:00:00Z'));
    expect(formatTimelineMonth(october.currentMonth)).toBe('October 2026');
    const active = september.cards.filter(card => card.current);
    expect(active).toHaveLength(1);
    expect(active[0].role).toBe('Co-Founder');
    for (const card of september.cards) {
      const later = october.cards.find(candidate => candidate.id === card.id)!;
      if (card.current) {
        expect(later.endTimestamp).toBeGreaterThan(card.endTimestamp);
        expect(later.period).toContain('present');
      } else {
        expect(later.endTimestamp).toBe(card.endTimestamp);
      }
      expect(card.top).toBeGreaterThanOrEqual(0);
      expect(card.top + card.height).toBeLessThanOrEqual(100.000001);
    }
  });

  it('formats dates and current periods for Spanish panels', () => {
    const october = buildTimelineLayout(workTimeline, new Date('2026-10-01T00:00:00Z'), 'es');
    expect(formatTimelineMonth(october.currentMonth, 'es')).toMatch(/octubre.*2026/i);
    expect(october.cards.find(card => card.current)?.period).toContain('presente');
  });

  it('derives earlier range starts and accepts month precision', () => {
    const entry = { ...workTimeline[0], start: '2020-02', end: '2021-03', current: false };
    const result = buildTimelineLayout([entry], now);
    expect(formatTimelineMonth(result.start)).toBe('February 2020');
    expect(result.cards[0].period).toBe('February 2020 — March 2021');
    expect(buildTimelineLayout([], now).cards).toEqual([]);
  });
});
