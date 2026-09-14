import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.addInitScript(() => {
    let id = 0;
    window.__frames = new Map();
    window.requestAnimationFrame = callback => { window.__frames.set(++id, callback); return id; };
    window.cancelAnimationFrame = key => window.__frames.delete(key);
    let time;
    window.__stepFrames = async (count = 1) => {
      time ??= performance.now();
      for (let i = 0; i < count; i++) {
        time += 1000 / 60;
        const callbacks = [...window.__frames.values()];
        window.__frames.clear();
        callbacks.forEach(callback => callback(time));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
  });
  // Backend warm-up and external audio are unrelated to these local panel checks.
  await page.route('**/health', route => route.fulfill({ json: { status: 'ok' } }));
  await page.route('**/api/chat', route => route.fulfill({ status: 503, json: { detail: 'Offline browser fixture' } }));
  await page.route('http://127.0.0.1:53173/', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><head><link rel="stylesheet" href="/src/style.css"></head><body></body></html>',
  }));
  await page.goto('http://127.0.0.1:53173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { CSS3DRenderer } = await import('/node_modules/three/examples/jsm/renderers/CSS3DRenderer.js');
    const { PanelSystem } = await import('/src/panels.ts');
    const { Input } = await import('/src/input.ts');
    const { landmarks } = await import('/src/world/registry.ts');
    document.body.replaceChildren();
    window.__frames.clear();
    const surface = document.createElement('div');
    surface.id = 'test-surface';
    surface.style.cssText = 'position:fixed;inset:0;background:#cadfce';
    document.body.append(surface);
    const stick = document.createElement('div');
    stick.append(document.createElement('span'));
    const input = new Input(surface, stick, () => {});
    const renderer = new CSS3DRenderer();
    renderer.setSize(innerWidth, innerHeight);
    renderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none';
    document.body.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 400);
    const panels = new PanelSystem(scene);
    const player = new THREE.Vector3();

    window.__visit = (index, side = 'front') => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      const landmark = landmarks[index];
      const frontDirection = landmark.rotation === 0 ? 1 : -1;
      const direction = side === 'front' ? frontDirection : -frontDirection;
      player.set(landmark.position[0], 0, landmark.position[1] + direction * 6);
      camera.position.set(landmark.position[0], 11, landmark.position[1] + direction * 18);
      camera.lookAt(landmark.position[0], 7, landmark.position[1]);
      camera.updateMatrixWorld();
      panels.update(player, camera, 1);
      renderer.render(scene, camera);
    };
    window.__panelInput = input;
    window.__visit(0);
  });

  let panel = page.locator('.world-panel:visible');
  assert.equal(await panel.count(), 1);
  await panel.locator('h1').filter({ hasText: 'Big ideas' }).waitFor();
  assert.equal(await panel.locator('iframe').count(), 0);
  assert.equal(await panel.locator('.panel-projects').count(), 1);
  assert.equal(await panel.locator('.project-card').count(), 16);
  assert.equal(await panel.evaluate(el => getComputedStyle(el).userSelect), 'text');

  const rect = await panel.boundingBox();
  const before = await page.evaluate(() => window.__panelInput.yaw);
  await page.mouse.move(rect.x + 40, rect.y + 70);
  await page.mouse.down();
  await page.mouse.move(rect.x + 100, rect.y + 90, { steps: 3 });
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.__panelInput.yaw), before);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(100);
  assert.ok(await panel.evaluate(el => el.scrollTop) > 0);
  await page.mouse.move(20, 400);
  await page.mouse.down();
  await page.mouse.move(140, 400, { steps: 3 });
  await page.mouse.up();
  assert.notEqual(await page.evaluate(() => window.__panelInput.yaw), before);

  await page.evaluate(() => window.__visit(0, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'You found the other side.' }).waitFor();
  assert.equal(await panel.locator('.secret-panel__rocket').count(), 1);
  console.log('PASS: React front/back content, internal scroll, pointer isolation, and opposite secret surface.');
  await page.screenshot({ path: '/tmp/portfolio-back-panel.png' });

  await page.evaluate(() => window.__visit(1));
  panel = page.locator('.world-panel:visible');
  await panel.locator('.timeline-card').first().waitFor();
  assert.equal(await panel.locator('.timeline-card').count(), 7);
  assert.match(await panel.locator('.detail-title').textContent(), /Select a role/);
  const role = panel.getByRole('button', { name: /AI Engineer/ }).first();
  await role.click();
  assert.match(await panel.locator('.detail-title').textContent(), /AI Engineer/);
  await page.mouse.move(20, 400);
  assert.match(await panel.locator('.detail-title').textContent(), /AI Engineer/);
  console.log('PASS: date-scaled timeline starts neutral and keeps explicitly selected role details.');

  await page.evaluate(() => window.__visit(2));
  panel = page.locator('.world-panel:visible');
  await panel.locator('.education-node').first().waitFor();
  assert.equal(await panel.locator('.education-node').count(), 8);
  assert.equal(await panel.getByText('Top skills', { exact: true }).count(), 0);
  const node = panel.locator('.education-node').first();
  const nodeBefore = await node.boundingBox();
  await node.hover();
  await page.mouse.down();
  await page.mouse.move(nodeBefore.x + 35, nodeBefore.y + 25, { steps: 3 });
  await page.mouse.up();
  const nodeAfter = await node.boundingBox();
  assert.notDeepEqual(nodeAfter, nodeBefore);
  await page.evaluate(() => window.__stepFrames(600));
  assert.ok(await panel.locator('.education-graph__detail p').textContent());
  const overlaps = await panel.locator('.education-node').evaluateAll(nodes => {
    let pairs = 0;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (Math.abs(parseFloat(nodes[i].style.left) - parseFloat(nodes[j].style.left)) < 118 &&
          Math.abs(parseFloat(nodes[i].style.top) - parseFloat(nodes[j].style.top)) < 60) pairs++;
    }
    return pairs;
  });
  assert.equal(overlaps, 0);
  console.log('PASS: education and language graph has eight draggable nodes and no Skills section.');

  await page.evaluate(() => window.__visit(5));
  panel = page.locator('.world-panel:visible');
  await panel.locator('.bench-game__figure').waitFor();
  assert.equal(await panel.locator('.bench-game__fact').count(), 4);
  assert.equal(await panel.locator('.bench-game__meter').count(), 1);
  const meter = panel.locator('.bench-game__meter');
  await page.evaluate(async () => {
    const line = document.querySelector('.bench-game__meter');
    for (let frame = 0; frame < 180; frame++) {
      if (parseFloat(line.style.getPropertyValue('--arrow-position')) < 20) return;
      await window.__stepFrames();
    }
    throw new Error('The timing arrow never reached the miss region.');
  });
  await meter.click();
  assert.match(await panel.locator('.bench-game__status span').textContent(), /bar height/);
  await meter.click();
  await meter.click();
  assert.match(await panel.locator('.bench-game__status strong').textContent(), /stalled/);
  await panel.getByRole('button', { name: 'Try again' }).click();
  assert.match(await panel.locator('.bench-game__status strong').textContent(), /Press/);
  console.log('PASS: hobbies panel renders the bench-press game and all hobby facts beside it.');

  const benchWin = await page.evaluate(async () => {
    const game = document.querySelector('.bench-game');
    let hits = 0;
    for (let frame = 0; frame < 900 && !game.classList.contains('bench-game--won'); frame++) {
      await window.__stepFrames();
      const line = game.querySelector('.bench-game__meter');
      const arrow = parseFloat(line.style.getPropertyValue('--arrow-position'));
      if (Math.abs(arrow - 50) < 3) {
        game.querySelector('.bench-game__press').click();
        hits++;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    return { won: game.classList.contains('bench-game--won'), hits, height: game.querySelector('.bench-game__status span').textContent };
  });
  assert.equal(benchWin.won, true);
  assert.equal(benchWin.hits, 5);
  assert.match(benchWin.height, /100%/);
  console.log('PASS: five accurately timed browser presses reach the bench-press win state.');

  await page.evaluate(() => window.__visit(3));
  panel = page.locator('.world-panel:visible');
  const game = panel.locator('.cat-runner');
  await game.getByRole('button', { name: 'Start journey' }).click();
  await page.evaluate(() => window.__stepFrames(260));
  assert.match(await game.getByRole('status').textContent(), /chair got in the way/);
  await game.getByRole('button', { name: 'Play again' }).click();
  assert.equal(await game.locator('progress').getAttribute('value'), '0');
  await game.getByRole('button', { name: 'Hold to jump', exact: true }).press('ArrowUp');
  await page.evaluate(() => window.__stepFrames(70));
  const catWin = await page.evaluate(async () => {
    const game = document.querySelector('.cat-runner');
    let lastJump = -100;
    let jumps = 0;
    let meows = 0;
    for (let frame = 0; frame < 1900 && !game.classList.contains('cat-runner--won'); frame++) {
      if (game.classList.contains('cat-runner--failed')) break;
      const nearby = [...game.querySelectorAll('.cat-runner__chair')].some(chair => {
        const x = chair.transform.baseVal.getItem(0).matrix.e;
        return x > 130 && x < 230;
      });
      if (nearby && frame - lastJump > 55) {
        game.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        lastJump = frame;
        jumps++;
      }
      if (game.querySelector('.cat-runner__meow')) meows++;
      await window.__stepFrames();
    }
    return { won: game.classList.contains('cat-runner--won'), jumps, meows, progress: game.querySelector('progress').value };
  });
  assert.equal(catWin.won, true);
  assert.ok(catWin.jumps >= 6);
  assert.ok(catWin.meows > 60);
  assert.equal(catWin.progress, 100);
  assert.equal(await game.locator('.cat-runner__eating').count(), 1);
  assert.equal(await game.locator('.cat-runner__cat').getAttribute('fill'), '#d9d9d9');
  assert.match(await game.getByRole('status').textContent(), /is eating/);
  assert.equal(await panel.evaluate(el => el.querySelector('.cat-runner').compareDocumentPosition(el.querySelector('.profile-lines')) & Node.DOCUMENT_POSITION_FOLLOWING), 4);
  await panel.evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: '/tmp/portfolio-cat-dinner.png' });
  await game.getByRole('button', { name: 'Play again' }).click();
  await page.evaluate(() => window.__stepFrames(30));
  const beforePause = await game.locator('progress').getAttribute('value');
  await page.evaluate(async () => { window.__visit(0); await window.__stepFrames(120); window.__visit(3); });
  assert.equal(await game.locator('progress').getAttribute('value'), beforePause);
  console.log('PASS: cat runner collision/retry, keyboard jump, chair-clearing victory, periodic meows, dinner animation, About Me ordering, and off-panel pause.');

  await page.evaluate(() => window.__visit(4));
  panel = page.locator('.world-panel:visible');
  const dogGame = panel.locator('.dog-goal');
  const aimPenalty = async (x, y) => {
    await dogGame.locator('svg').scrollIntoViewIfNeeded();
    const bounds = await dogGame.locator('svg').boundingBox();
    await page.mouse.click(bounds.x + x / 640 * bounds.width, bounds.y + y / 310 * bounds.height);
  };
  const shoot = async (frames) => {
    const button = dogGame.getByRole('button', { name: 'Hold to shoot' });
    await button.focus();
    await page.keyboard.down('Space');
    await page.evaluate(n => window.__stepFrames(n), frames);
    await page.keyboard.up('Space');
    await page.evaluate(() => window.__stepFrames(75));
  };
  await aimPenalty(320, 145);
  await shoot(1);
  assert.match(await dogGame.getByRole('status').textContent(), /Saved!/);
  for (let shot = 1; shot < 5; shot++) {
    await dogGame.getByRole('button', { name: 'Next penalty' }).click();
    await aimPenalty(shot % 2 ? 420 : 220, 75);
    await shoot(65);
    assert.equal(await dogGame.locator('.dog-goal__result text').textContent(), 'GOAL!');
  }
  assert.match(await dogGame.getByRole('status').textContent(), /You win/);
  assert.match(await dogGame.locator('.dog-goal__score strong').textContent(), /4 goals · 5\/5/);
  await page.screenshot({ path: '/tmp/portfolio-dog-goal-win.png' });
  await dogGame.getByRole('button', { name: 'Play again' }).click();
  await aimPenalty(465, 30);
  await shoot(30);
  assert.match(await dogGame.getByRole('status').textContent(), /Just wide/);
  await dogGame.getByRole('button', { name: 'Next penalty' }).click();
  await dogGame.getByRole('button', { name: 'Hold to shoot' }).focus();
  await page.keyboard.down('Space');
  await page.evaluate(() => window.__stepFrames(15));
  const beforeDogPause = await dogGame.getByRole('meter').getAttribute('aria-valuenow');
  await page.evaluate(async () => { window.__visit(0); await window.__stepFrames(120); window.__visit(4); });
  assert.equal(await dogGame.getByRole('meter').getAttribute('aria-valuenow'), beforeDogPause);
  await page.keyboard.up('Space');
  await page.evaluate(() => window.__stepFrames(75));
  await dogGame.getByRole('button', { name: 'Next penalty' }).click();
  console.log('PASS: penalty save, four corner goals, match win, restart, miss, and off-panel pause.');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const index of [3, 4, 5]) {
      await page.evaluate(index => window.__visit(index), index);
      const visible = page.locator('.world-panel:visible');
      await visible.evaluate(el => { el.scrollTop = 0; });
      assert.ok(await visible.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      if (index === 4) {
        await visible.locator('.dog-goal__scene').press('ArrowLeft');
        await shoot(60);
        await visible.getByRole('button', { name: /Next penalty|Play again/ }).click();
      }
      if (index === 5) {
        const facts = await visible.locator('.bench-game__fact').evaluateAll(els => els.map(el => ({ x: el.offsetLeft, y: el.offsetTop })));
        assert.equal(new Set(facts.map(fact => fact.y)).size, 2);
      }
      await page.screenshot({ path: `/tmp/portfolio-panel-${index}-${width}.png` });
    }
  }
  await page.setViewportSize({ width: 1000, height: 800 });
  console.log('PASS: all three minigames fit 320px and 390px viewports; dog controls work at both widths; hobby facts form two rows.');

  for (let index = 0; index < 7; index++) for (const side of ['front', 'back']) {
    await page.evaluate(({ index, side }) => window.__visit(index, side), { index, side });
    const visible = page.locator('.world-panel:visible');
    assert.equal(await visible.count(), 1);
    assert.equal(await visible.locator('h1').count(), 1);
    assert.equal(await visible.locator('iframe').count(), 0);
  }
  console.log('PASS: all fourteen landmark surfaces render React content.');

  const chatResult = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { ChatUI } = await import('/src/chat/ChatUI.ts');
    const { landmarks } = await import('/src/world/registry.ts');
    localStorage.clear();
    const chat = new ChatUI(new THREE.Scene(), () => true);
    await chat.send(`Take me to ${landmarks[0].id}`);
    await chat.send(`Take me to ${landmarks[1].id}`);
    const history = JSON.parse(localStorage.getItem('portfolio.conversation.v1'));
    const beforeFinish = chat.speech.snapshot.state;
    const first = chat.speech.snapshot.fullText;
    const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 400);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 3, 0);
    chat.update(new THREE.Vector3(30, 0, 0), new THREE.Vector3(), camera, .05);
    const collapsed = chat.object.element.classList.contains('is-far');
    let queuedStarted = false;
    for (let index = 0; index < 1000; index += 1) {
      chat.update(new THREE.Vector3(30, 0, 0), new THREE.Vector3(), camera, .05);
      if (chat.speech.snapshot.fullText !== first && chat.speech.snapshot.state !== 'idle') {
        queuedStarted = true;
        break;
      }
    }
    chat.speech.dispose();
    return { roles: history.map(message => message.role), beforeFinish, collapsed, queuedStarted };
  });
  assert.deepEqual(chatResult.roles, ['user', 'assistant', 'user', 'assistant']);
  assert.equal(chatResult.beforeFinish, 'received');
  assert.equal(chatResult.collapsed, true);
  assert.equal(chatResult.queuedStarted, true);
  console.log('PASS: complete received history persists independently of visual speech; distant chat collapses; queued reply starts in order.');
} finally {
  await browser.close();
}
