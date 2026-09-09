import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserHistoryStore, createChatService, ServiceError, validateChatReply } from './services';
import { SpeechQueue, type SpeechSnapshot } from './chat/Speech';
import { config } from './config';
import { landmarks } from './world/registry';
import { entrance, guidedRoute, localRoute, navigation, segmentClear, shortestPath } from './world/navigation';
import { moveWithCollisions, onIsland, turn } from './world/physics';
import { choosePanel } from './panels';
import { biomeWeights } from './world/atmosphere';
import { biomes } from './world/registry';
import { createEnvironment } from './world/environment';
import { Companion } from './world/actors';
import { Vector3 } from 'three';

afterEach(() => vi.unstubAllGlobals());

describe('service contracts', () => {
  it.each(landmarks)('accepts the canonical destination $id', landmark => {
    expect(validateChatReply({ message: 'Follow me', destination_object_id: landmark.id }).destination_object_id).toBe(landmark.id);
  });
  it.each([null, {}, { message: 42, destination_object_id: null }, { message: 'Hi', destination_object_id: 'unknown-place' }])('rejects malformed responses %j', value => {
    expect(() => validateChatReply(value)).toThrow(ServiceError);
    try { validateChatReply(value); } catch (error) { expect((error as ServiceError).code).toBe('invalid-response'); }
  });
  it('accepts a conversation without navigation', () => {
    expect(validateChatReply({ message: 'Hello', destination_object_id: null }).destination_object_id).toBeNull();
  });
  it.each(landmarks)('mock guide navigates to the requested ID $id', async landmark => {
    const reply = await createChatService().send(`Take me to ${landmark.id}`, []);
    expect(reply.destination_object_id).toBe(landmark.id);
  });
  it('represents cancelled requests explicitly', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(createChatService().send('hello', [], controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  });
});

describe('panel selection and biome blending', () => {
  it('retains an open panel in the hysteresis band, then closes beyond it', () => {
    const landmark = landmarks[0];
    const point = (offset: number) => ({ x: landmark.position[0], z: landmark.position[1] - offset });
    expect(choosePanel(point(landmark.proximityRadius - .01), null)?.id).toBe(landmark.id);
    const band = (landmark.proximityRadius + config.panels.deactivationRadius) / 2;
    expect(choosePanel(point(band), null)).toBeNull();
    expect(choosePanel(point(band), landmark)?.id).toBe(landmark.id);
    expect(choosePanel(point(config.panels.deactivationRadius + .01), landmark)).toBeNull();
  });
  it.each(landmarks)('selects only the nearest panel at $id', landmark => {
    expect(choosePanel({ x: landmark.position[0], z: landmark.position[1] }, null)?.id).toBe(landmark.id);
  });
  it('normalizes overlapping biome influence and preserves default atmosphere far away', () => {
    for (let x = -100; x <= 45; x += 5) {
      const result = biomeWeights({ x, z: 0 });
      expect(result.base + result.weights.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1);
      expect(result.weights.every(item => item.weight >= 0 && item.weight <= 1)).toBe(true);
    }
    expect(biomeWeights({ x: 1000, z: 1000 }).base).toBe(1);
  });
  it.each(landmarks)('has continuous biome influence at the outer boundary of $id', landmark => {
    const radius = biomes[landmark.biome].outerRadius;
    const weight = (offset: number) => biomeWeights({ x: landmark.position[0], z: landmark.position[1] - radius + offset }).weights.find(item => item.landmark.id === landmark.id)!.weight;
    expect(weight(-.001)).toBe(0);
    expect(weight(.001)).toBeLessThan(.00001);
    expect(weight(radius)).toBeGreaterThan(weight(.001));
  });
});

describe('companion behavior in the authored world', () => {
  const environment = createEnvironment();
  const obstacles = [...environment.obstacles, ...landmarks.map(item => ({ x: item.position[0], z: item.position[1], radius: item.collisionRadius }))];
  it('keeps every authored navigation edge clear of actual environmental colliders', () => {
    const blocked: string[] = [];
    for (const node of navigation) for (const id of node.neighbors) {
      const next = navigation.find(item => item.id === id)!;
      if (!segmentClear(node, next, obstacles, config.player.radius)) blocked.push(`${node.id} -> ${id}`);
    }
    expect(blocked).toEqual([]);
  });
  it('remains idle inside follow radius and stops at the target radius', () => {
    const companion = new Companion(true, []);
    const player = new Vector3(config.companion.followRadius - .1, 0, 0);
    companion.update(player, .016, 0, false);
    expect(companion.state).toBe('IDLE'); expect(companion.model.position.length()).toBe(0);
    player.x = config.companion.followRadius + 1;
    companion.update(player, .016, .016, false); expect(companion.state).toBe('FOLLOW_USER');
    for (let frame = 0; frame < 500; frame++) companion.update(player, .016, frame * .016, false);
    expect(companion.state).toBe('IDLE');
    expect(companion.model.position.distanceTo(player)).toBeLessThanOrEqual(config.companion.targetRadius);
    expect(companion.model.position.distanceTo(player)).toBeGreaterThan(config.companion.chatRadius);
  });
  it.each(landmarks)('reaches $id without abandoning guided travel for a distant player', landmark => {
    const companion = new Companion(true, obstacles);
    companion.model.position.set(0, 0, 6);
    expect(companion.guide(landmark.id)).toBe(true);
    const player = new Vector3(45, 0, 0);
    let frame = 0;
    while (companion.state === 'GUIDED_TRAVEL' && frame < 10000) {
      companion.update(player, .016, frame * .016, false); frame++;
    }
    expect(companion.state).toBe('AT_DESTINATION');
    const target = entrance(landmark);
    expect(Math.hypot(companion.model.position.x - target.x, companion.model.position.z - target.z)).toBeLessThan(config.companion.arrivalRadius + .2);
    for (let index = 0; index < Math.ceil(config.companion.guidedHold / .016) + 5; index++) companion.update(player, .016, (frame + index) * .016, true);
    expect(companion.state).toBe('AT_DESTINATION');
    companion.update(player, .016, 200, false); expect(companion.state).toBe('FOLLOW_USER');
  });
});

describe('browser history', () => {
  function storage(value: string | null) {
    const store = { getItem: vi.fn(() => value), setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal('localStorage', store); return store;
  }
  it('filters malformed entries and keeps only the configured recent messages', () => {
    storage(JSON.stringify([{ role: 'user', content: 'old' }, { role: 'system', content: 'bad' }, null, { role: 'assistant', content: 'recent' }, { role: 'user', content: 'new', extra: true }]));
    expect(new BrowserHistoryStore('test', 2).load()).toEqual([{ role: 'assistant', content: 'recent' }, { role: 'user', content: 'new' }]);
  });
  it.each(['not json', '{}', 'null'])('recovers from invalid persisted data %s', value => {
    storage(value); expect(new BrowserHistoryStore().load()).toEqual([]);
  });
  it('bounds writes and permits clearing', () => {
    const store = storage(null), history = new BrowserHistoryStore('test', 1);
    history.save([{ role: 'user', content: 'first' }, { role: 'assistant', content: 'last' }]);
    expect(store.setItem).toHaveBeenCalledWith('test', JSON.stringify([{ role: 'assistant', content: 'last' }]));
    history.clear(); expect(store.removeItem).toHaveBeenCalledWith('test');
  });
  it('remains usable when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem() { throw Error('disabled'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('disabled'); } });
    const history = new BrowserHistoryStore();
    expect(history.load()).toEqual([]); expect(() => history.save([])).not.toThrow(); expect(() => history.clear()).not.toThrow();
  });
});

describe('speech lifecycle', () => {
  it('distinguishes receipt, display, completion, and queued responses', () => {
    const states: SpeechSnapshot[] = [], speech = new SpeechQueue(config.speech, state => states.push(state));
    speech.enqueue('Hi.'); speech.enqueue('Next');
    expect(speech.snapshot.state).toBe('received');
    speech.tick(0); expect(speech.snapshot.state).toBe('displaying'); expect(speech.snapshot.text).toBe('H');
    speech.tick(config.speech.characterDelay * 2 + .001);
    expect(speech.snapshot.text).toBe('Hi.'); expect(speech.snapshot.state).toBe('displaying');
    speech.tick(config.speech.periodDelay); expect(speech.snapshot.state).toBe('finished');
    speech.tick(config.speech.holdDuration - .01); expect(speech.snapshot.fullText).toBe('Hi.');
    speech.tick(.02); expect(speech.snapshot.state).toBe('received'); expect(speech.snapshot.fullText).toBe('Next');
    speech.tick(1); speech.tick(config.speech.holdDuration); expect(speech.snapshot.state).toBe('idle');
    expect(states.filter(state => state.state === 'received').map(state => state.sequence)).toEqual([1, 2]);
  });
  it.each([[' ', 'spaceDelay'], [',', 'commaDelay'], ['.', 'periodDelay'], ['\n', 'lineBreakDelay']] as const)('pauses after %j before the next character', (punctuation, delay) => {
    const speech = new SpeechQueue(config.speech, () => {});
    speech.enqueue(`${punctuation}A`); speech.tick(0);
    speech.tick(config.speech[delay] * .75); expect(speech.snapshot.text).toBe(punctuation);
    speech.tick(config.speech[delay] * .3); expect(speech.snapshot.text).toBe(`${punctuation}A`);
  });
  it('ignores new work after disposal and needs no browser audio to display text', () => {
    const speech = new SpeechQueue(config.speech, () => {});
    speech.enqueue('🙂'); speech.tick(0); expect(speech.snapshot.text).toBe('🙂');
    speech.dispose(); speech.enqueue('ignored'); speech.tick(100);
    expect(speech.snapshot.fullText).toBe('🙂');
  });
});

describe('navigation and physical boundaries', () => {
  const obstacles = landmarks.map(item => ({ x: item.position[0], z: item.position[1], radius: item.collisionRadius }));
  it.each(landmarks)('connects the road to $id with traversable segments', landmark => {
    const route = shortestPath('road:0', landmark.navigationNode);
    expect(route.length).toBeGreaterThan(1); expect(route.at(-1)).toEqual(entrance(landmark));
    for (let index = 1; index < route.length; index++) {
      expect(segmentClear(route[index - 1], route[index], obstacles, config.player.radius)).toBe(true);
      expect(onIsland(route[index])).toBe(true);
    }
  });
  it('has reciprocal edges and rejects nonexistent route endpoints', () => {
    for (const node of navigation) for (const neighbor of node.neighbors) expect(navigation.find(item => item.id === neighbor)?.neighbors).toContain(node.id);
    expect(shortestPath('missing', navigation[0].id)).toEqual([]);
  });
  it('routes around obstacles when approaching a road from open ground', () => {
    const start = { x: -5, z: 0 }, goal = { x: 5, z: 0 }, blockers = [{ x: 0, z: 0, radius: 2 }];
    const route = localRoute(start, goal, blockers, .45);
    expect(route.length).toBeGreaterThan(1); expect(route.at(-1)).toEqual(goal);
    const points = [start, ...route];
    for (let index = 1; index < points.length; index++) expect(segmentClear(points[index - 1], points[index], blockers, .45)).toBe(true);
  });
  it('guided travel ends at the requested entrance', () => {
    const destination = landmarks[0];
    expect(guidedRoute({ x: 0, z: 6 }, destination.navigationNode, obstacles, config.player.radius).at(-1)).toEqual(entrance(destination));
  });
  it('prevents shoreline and structure penetration while allowing sliding', () => {
    const boundary = { x: config.world.centerX + config.world.radiusX - config.world.shoreline - config.player.radius, z: 0 };
    expect(onIsland(boundary)).toBe(true);
    expect(moveWithCollisions(boundary, { x: 1, z: 0 }, [], config.player.radius)).toEqual(boundary);
    const moved = moveWithCollisions({ x: -2, z: 0 }, { x: 1, z: .5 }, [{ x: 0, z: 0, radius: 1 }], .45);
    expect(moved).toEqual({ x: -2, z: .5 });
  });
  it('takes the short rotation across the angle wrap boundary', () => {
    expect(turn(Math.PI - .1, -Math.PI + .1, .5)).toBeCloseTo(Math.PI);
  });
});
