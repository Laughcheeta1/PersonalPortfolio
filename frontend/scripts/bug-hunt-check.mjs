import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const origin = process.env.BUG_HUNT_TEST_ORIGIN || 'http://127.0.0.1:53173';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [], submissions = [], starts = [];
  let boardLoads = 0, failSave = false;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/bug-hunt/leaderboard', route => {
    boardLoads++;
    return route.fulfill({ json: { duration_seconds: 45, entries: [{ rank: 1, display_name: starts.at(-1)?.display_name ?? 'Previous name', score: submissions.length ? submissions[0].score : 12 }] } });
  });
  await page.route('**/bug-hunt/sessions', route => {
    starts.push(route.request().postDataJSON());
    return route.fulfill({ json: { session_id: 'browser-round', session_token: 'browser-token', duration_seconds: 45 } });
  });
  await page.route('**/bug-hunt/sessions/browser-round/score', route => {
    const score = route.request().postDataJSON(); submissions.push(score);
    if (failSave) { failSave = false; return route.fulfill({ status: 503, json: { detail: 'Temporary test outage' } }); }
    return route.fulfill({ json: { score: score.score, personal_best: score.score } });
  });
  await page.route(`${origin}/`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="margin:0"></body></html>' }));
  await page.goto(origin);
  await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { BugHunt } = await import('/src/bug-hunt/BugHunt.ts');
    const { Player } = await import('/src/world/actors.ts');
    const { createEnvironment } = await import('/src/world/environment.ts');
    const { createLandmark } = await import('/src/world/models.ts');
    const { landmarks } = await import('/src/world/registry.ts');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#9ad7e1');
    scene.add(new THREE.HemisphereLight('#fff8df', '#6a9777', 2));
    const sun = new THREE.DirectionalLight('#fff0cf', 3); sun.position.set(45, 65, 25); scene.add(sun);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
    document.body.append(renderer.domElement);
    const environment = createEnvironment(); scene.add(environment.group);
    for (const landmark of landmarks) {
      const model = createLandmark(landmark.model); model.position.set(landmark.position[0], 0, landmark.position[1]); model.rotation.y = landmark.rotation; scene.add(model);
    }
    const player = new Player(false, environment.obstacles); scene.add(player.model); player.model.position.set(60, 0, 0);
    const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 500);
    const game = new BugHunt(scene, document.body, player, renderer.domElement, () => true);
    let now = performance.now(); Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    const render = () => renderer.render(scene, camera);
    window.__hunt = { game, player, camera, render, step(ms = 0, dt = 0) { now += ms; game.update(dt, now / 1000); render(); } };
    camera.position.set(49, 9, 13); camera.lookAt(67, 2, 1); window.__hunt.step();
  });
  await page.getByRole('button', { name: 'Start hunt', exact: true }).waitFor();
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__hunt.render());
  await page.screenshot({ path: '/tmp/portfolio-bug-hunt-entrance.png' });
  assert.ok(boardLoads >= 1);
  await page.getByRole('textbox', { name: 'Leaderboard name' }).fill('Browser Hunter');
  const renamedBoard = page.waitForResponse(response => response.url().endsWith('/bug-hunt/leaderboard'));
  await page.getByRole('button', { name: 'Start hunt', exact: true }).click();
  assert.equal((await (await renamedBoard).json()).entries[0].display_name, 'Browser Hunter');
  await page.waitForFunction(() => window.__hunt.game.snapshot.phase === 'playing');
  assert.equal(starts[0].display_name, 'Browser Hunter');
  await page.evaluate(() => {
    const { game, player, step } = window.__hunt;
    const target = game.snapshot.bugs[0];
    player.model.position.set(target.x, 0, target.z - 1.2); player.model.rotation.y = 0;
    step();
  });
  const before = await page.evaluate(() => window.__hunt.game.snapshot.score);
  await page.mouse.click(500, 700);
  const swing = await page.evaluate(() => {
    window.__hunt.step(150);
    return { score: window.__hunt.game.snapshot.score, rotation: window.__hunt.player.model.getObjectByName('rightArm').rotation.x };
  });
  assert.equal(swing.score, before + 1); assert.ok(swing.rotation < -1);
  await page.mouse.click(500, 700);
  await page.evaluate(() => window.__hunt.step(100));
  assert.equal(await page.evaluate(() => window.__hunt.game.snapshot.score), before + 1);
  await page.evaluate(() => window.__hunt.step(500));
  const previousSwing = await page.evaluate(() => window.__hunt.game.snapshot.swingAt);
  await page.mouse.move(400, 700); await page.mouse.down();
  await page.mouse.move(500, 710, { steps: 4 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.__hunt.game.snapshot.swingAt), previousSwing);
  await page.evaluate(() => window.__hunt.step(46000));
  await page.waitForFunction(() => window.__hunt.game.snapshot.phase === 'finished');
  await page.getByRole('status').filter({ hasText: 'Score saved' }).waitFor();
  assert.deepEqual(submissions, [{ session_token: 'browser-token', score: 1 }]);
  await page.waitForFunction(() => document.querySelector('[data-start]').textContent === 'Play again');
  assert.ok(boardLoads >= 2);
  await page.evaluate(() => window.__hunt.render());
  await page.screenshot({ path: '/tmp/portfolio-bug-hunt-score.png' });
  failSave = true;
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await page.waitForFunction(() => window.__hunt.game.snapshot.phase === 'playing');
  await page.evaluate(() => window.__hunt.step(46000));
  await page.getByRole('button', { name: 'Retry saving score', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__hunt.game.snapshot.phase), 'unsaved');
  await page.getByRole('button', { name: 'Retry saving score', exact: true }).click();
  await page.waitForFunction(() => window.__hunt.game.snapshot.phase === 'finished');
  assert.equal(submissions.length, 3);
  assert.deepEqual(submissions[1], submissions[2]);
  await page.evaluate(() => {
    const { camera, player, step } = window.__hunt;
    player.model.position.set(29, 0, 0); camera.position.set(43, 95, 78); camera.lookAt(40, 0, 0); step();
  });
  await page.screenshot({ path: '/tmp/portfolio-bug-hunt-overview.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: real scene entrance and layout; saved leaderboard loads; named round starts; mouse cane animation hits a bug; cooldown and drag isolation; timer expiry submits exactly one score and refreshes leaderboard; failed save retries the same score.');
  const main = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const mainErrors = []; main.on('pageerror', error => mainErrors.push(error.message));
  await main.route('**/health', route => route.fulfill({ json: { status: 'ok' } }));
  await main.goto(origin, { waitUntil: 'domcontentloaded' });
  await main.waitForFunction(() => window.portfolioDebug?.bugHunt?.bugs?.length === 8);
  assert.equal(await main.evaluate(() => window.portfolioDebug.bugHunt.phase), 'idle');
  assert.deepEqual(mainErrors, []);
  console.log('PASS: normal application initializes the integrated eight-bug game without browser exceptions.');
} finally { await browser.close(); }
