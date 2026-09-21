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
  const i18nModuleUrl = await page.evaluate(async () => {
    const source = await (await fetch('/src/panel-content/index.tsx')).text();
    return source.match(/"(\/src\/i18n\/index\.ts\?[^" ]+)"/)?.[1] ?? '/src/i18n/index.ts';
  });
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
  await panel.locator('h1').filter({ hasText: 'Projects' }).waitFor();
  assert.equal(await panel.locator('iframe').count(), 0);
  assert.equal(await panel.locator('.panel-projects').count(), 1);
  assert.equal(await panel.locator('.project-planet').count(), 16);
  assert.equal(await panel.evaluate(el => getComputedStyle(el).userSelect), 'text');
  assert.equal(await panel.evaluate(el => el.style.width), '660px');
  assert.equal(await panel.evaluate(el => el.style.height), '510px');
  assert.equal(await panel.locator('.project-card').count(), 0);
  assert.equal(await panel.locator('.panel-intro, .panel-orbit, .project-universe__hint').count(), 0);
  assert.equal(await panel.locator('.project-planet').evaluateAll(planets => planets.every(planet => !planet.textContent?.trim())), true);
  await panel.locator('.project-planet').first().hover();
  await panel.locator('.project-hover-card').waitFor();
  assert.ok((await panel.locator('.project-hover-card').textContent()).trim());
  await page.mouse.move(20, 400);
  assert.equal(await panel.locator('.project-hover-card').count(), 0);
  await page.evaluate(async moduleUrl => { const { setLanguage } = await import(moduleUrl); setLanguage('es'); }, i18nModuleUrl);
  await panel.locator('h1').filter({ hasText: 'Proyectos' }).waitFor();
  assert.equal(await panel.getByText('Proyectos personales', { exact: true }).count(), 1);
  await page.evaluate(async moduleUrl => { const { setLanguage } = await import(moduleUrl); setLanguage('en'); }, i18nModuleUrl);
  await panel.locator('h1').filter({ hasText: 'Projects' }).waitFor();

  const rect = await panel.boundingBox();
  const before = await page.evaluate(() => window.__panelInput.yaw);
  await page.mouse.move(rect.x + 40, rect.y + 70);
  await page.mouse.down();
  await page.mouse.move(rect.x + 100, rect.y + 90, { steps: 3 });
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.__panelInput.yaw), before);
  await panel.locator('.project-universe').first().hover();
  for (let attempt = 0; attempt < 3 && !(await panel.evaluate(el => el.scrollTop > 0)); attempt++) {
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(100);
  }
  assert.ok(await panel.evaluate(el => el.scrollTop) > 0);
  await page.mouse.move(20, 400);
  await page.mouse.down();
  await page.mouse.move(140, 400, { steps: 3 });
  await page.mouse.up();
  assert.notEqual(await page.evaluate(() => window.__panelInput.yaw), before);

  await page.evaluate(() => window.__visit(0, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'Ship Baby Ship!' }).waitFor();
  assert.equal(await panel.locator('.secret-panel__rocket').count(), 1);
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.equal(await panel.locator('.secret-panel__copy').textContent(), "I loved so much Telepatia's CEO motto that I now have it as my phone wallpaper.");
  assert.doesNotMatch(await panel.textContent(), /Telpatia/);
  assert.equal(await panel.locator('.secret-panel__signature').count(), 0);
  console.log('PASS: React front/back content, internal scroll, pointer isolation, and the Projects motto rear surface.');
  await page.screenshot({ path: '/tmp/portfolio-back-panel.png' });

  await page.evaluate(() => window.__visit(1, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'I live by two sacred phrases in my life:' }).waitFor();
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.equal(await panel.locator('.secret-panel__f22').count(), 1);
  assert.ok(await panel.locator('.secret-panel__f22-shock path').count() >= 3);
  assert.equal(await panel.locator('.secret-panel__copy').textContent(), '1. Either you come and give it all, or do not come');
  assert.equal(await panel.locator('.secret-panel__signature').textContent(), '2. Not really a phrase, but rather this image:');
  const workMottoImage = panel.locator('[data-testid="secret-panel-image"]');
  assert.equal(await workMottoImage.count(), 1);
  assert.match(await workMottoImage.getAttribute('src'), /\/panels\/f22\/so_you_want_pilot\.png$/);
  assert.match(await workMottoImage.getAttribute('alt'), /So You Want to Be a Pilot/);
  console.log('PASS: Work rear panel renders both sacred phrases and the moved pilot image.');

  await page.evaluate(() => window.__visit(1));
  panel = page.locator('.world-panel:visible');
  await panel.locator('.timeline-card').first().waitFor();
  assert.equal(await panel.locator('.timeline-card').count(), 7);
  assert.equal(await panel.locator('.panel-intro, .panel-cloud, .timeline-heading, .timeline-note').count(), 0);
  assert.equal(await panel.locator('.timeline-detail').count(), 0);
  assert.equal(await panel.locator('.timeline-hover-card').count(), 0);
  const timelineCardWidths = await panel.locator('.timeline-card').evaluateAll(cards => cards.map(card => card.offsetWidth));
  assert.equal(new Set(timelineCardWidths).size, 1, 'All timeline cards share one width.');
  const intervals = await panel.locator('.timeline-card').evaluateAll(cards => cards.map(card => ({
    top: parseFloat(card.style.top), height: parseFloat(card.style.height),
    start: Number(card.dataset.start), end: Number(card.dataset.end),
    side: card.closest('.timeline-side').classList.contains('timeline-side--left') ? 'left' : 'right',
  })));
  const dateScales = intervals.map(card => card.height / (card.end - card.start));
  assert.ok(dateScales.every(scale => Math.abs(scale / dateScales[0] - 1) < 0.00001), 'Card heights are proportional to actual date durations.');
  const boundaries = [...new Set(intervals.flatMap(card => [card.top, card.top + card.height]))].sort((a, b) => a - b);
  for (let index = 1; index < boundaries.length; index++) {
    if (boundaries[index] - boundaries[index - 1] < 0.0001) continue; // CSS serialization rounds percentages.
    const y = (boundaries[index - 1] + boundaries[index]) / 2;
    const active = intervals.filter(card => card.top <= y && card.top + card.height > y);
    assert.ok(Math.abs(active.filter(card => card.side === 'left').length - active.filter(card => card.side === 'right').length) <= 1, 'Every horizontal slice has balanced experience counts.');
  }
  assert.equal(await panel.locator('.timeline-endpoint time').first().getAttribute('datetime'), new Date().toISOString().slice(0, 7));
  const firstTimelineRole = (await panel.locator('.timeline-card').first().locator('.timeline-card__role').textContent()).trim();
  await panel.locator('.timeline-card').first().hover();
  await panel.locator('.timeline-hover-card').waitFor();
  assert.equal((await panel.locator('.timeline-hover-card h3').textContent()).trim(), firstTimelineRole);
  await panel.locator('.timeline-hover-card').hover();
  await page.waitForTimeout(450);
  assert.equal(await panel.locator('.timeline-hover-card').count(), 1, 'Popup remains open while the mouse is inside it.');
  assert.equal(await panel.locator('.timeline-card--current').count(), 1);
  assert.match(await panel.locator('.timeline-card--current').innerText(), /Co-Founder/);
  const rightTimelineCard = panel.locator('.timeline-side--right .timeline-card').last();
  await rightTimelineCard.hover();
  const timelineBounds = await panel.locator('.timeline').boundingBox();
  const rightHoverBounds = await panel.locator('.timeline-hover-card').boundingBox();
  assert.ok(rightHoverBounds.x >= timelineBounds.x - 1, 'Timeline hover card stays within the left edge.');
  assert.ok(rightHoverBounds.x + rightHoverBounds.width <= timelineBounds.x + timelineBounds.width + 1, 'Timeline hover card stays within the right edge.');
  await page.mouse.move(20, 400);
  await page.waitForTimeout(450);
  assert.equal(await panel.locator('.timeline-hover-card').count(), 0);
  await panel.evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: '/tmp/work-experience-panel.png' });
  console.log('PASS: date-scaled timeline starts neutral and shows a React hover popup for each role.');

  await page.evaluate(() => window.__visit(2));
  panel = page.locator('.world-panel:visible');
  await panel.locator('[data-testid="education-network"]').waitFor();
  const educationLayers = panel.locator('.education-layer');
  assert.equal(await educationLayers.count(), 4);
  assert.deepEqual(await educationLayers.evaluateAll(layers => layers.map(layer => ({
    id: layer.getAttribute('data-layer-id'),
    role: layer.getAttribute('data-role'),
    count: layer.querySelectorAll('[data-testid="education-node"]').length,
  }))), [
    { id: 'languages', role: 'input', count: 2 },
    { id: 'courses-and-certifications-01', role: 'hidden', count: 5 },
    { id: 'courses-and-certifications-02', role: 'hidden', count: 4 },
    { id: 'formal-education', role: 'output', count: 3 },
  ]);
  assert.equal(await panel.locator('[data-testid="education-node"]').count(), 14);
  assert.equal(await panel.locator('.education-connection').count(), 42);
  assert.deepEqual(await panel.locator('.education-node__kind').allTextContents(), [
    'Language', 'Language',
    'Course', 'Course', 'Course', 'Course', 'Course',
    'Course', 'Course', 'Course', 'Course',
    'University', 'University', 'University',
  ]);
  assert.equal(await panel.getByText(/Participation ICPC/i).count(), 0);
  assert.equal(await panel.locator('.education-graph__detail').count(), 0);
  assert.equal(await panel.locator('.panel-intro, .panel-nodes').count(), 0);
  assert.equal(await panel.locator('.education-layer__heading').count(), 0);
  assert.equal(await panel.locator('.education-node__core').count(), 0);
  assert.equal(await panel.getByText('Top skills', { exact: true }).count(), 0);
  const node = panel.locator('[data-testid="education-node"]').filter({ hasText: 'Systems Engineering' });
  await node.hover();
  assert.equal(await node.getAttribute('aria-pressed'), 'true');
  assert.match(await panel.locator('.education-graph__detail').textContent(), /Escuela de Ingeniería de Antioquia/);
  assert.ok(await panel.locator('.education-connection.is-active').count() > 0);
  await panel.locator('.education-graph').hover({ position: { x: 2, y: 2 } });
  assert.equal(await panel.locator('.education-graph__detail').count(), 0, 'Hover details close when the pointer leaves an unselected card.');
  assert.equal(await node.getAttribute('aria-pressed'), 'false');
  await node.hover();
  await node.click();
  const lockedDetail = await panel.locator('.education-graph__detail p').textContent();
  assert.equal(lockedDetail, 'Systems Engineering and Computing undergraduate program, in progress.');
  const otherNode = panel.locator('[data-testid="education-node"]').filter({ hasText: 'Python' }).first();
  await otherNode.hover();
  assert.equal(await node.getAttribute('data-locked'), 'true');
  assert.equal(await node.getAttribute('aria-pressed'), 'true');
  assert.equal(await panel.locator('.education-graph__detail p').textContent(), lockedDetail);
  await panel.locator('.education-graph').hover({ position: { x: 2, y: 2 } });
  assert.equal(await panel.locator('.education-graph__detail p').textContent(), lockedDetail, 'Selected details remain after the pointer leaves the card.');
  await node.click();
  assert.equal(await panel.locator('.education-graph__detail').count(), 0, 'Clicking the selected card again deselects it.');
  assert.equal(await node.getAttribute('aria-pressed'), 'false');
  console.log('PASS: education neural network has fourteen cards in four requested layers with three card categories.');

  await page.evaluate(() => window.__visit(2, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'The infinite Why.' }).waitFor();
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.match(await panel.locator('.secret-panel__copy').textContent(), /The thing I love most about AI/);
  assert.match(await panel.locator('.secret-panel__copy').textContent(), /infinite “Why” questions/);
  assert.match(await panel.locator('.secret-panel__copy').textContent(), /questioning everything/);
  assert.equal(await panel.locator('.secret-panel__signature').count(), 0);
  console.log('PASS: Education rear panel explains the infinite-Why idea behind the AI journey.');

  await page.evaluate(() => window.__visit(3));
  panel = page.locator('.world-panel:visible');
  assert.equal(await panel.locator('.cat-runner').count(), 0);
  await panel.locator('.panel-quote').waitFor();
  assert.equal(await panel.locator('.panel-quote').count(), 1);
  assert.match(await panel.locator('.panel-quote').textContent(), /Friedrich Nietzsche/);
  assert.equal(await panel.locator('.panel-intro').count(), 0);
  assert.equal(await panel.locator('h2').count(), 0);
  assert.equal(await panel.locator('.profile-lines').count(), 0);
  assert.equal(await panel.locator('a[href^="mailto:"]').count(), 0);
  assert.equal(await panel.locator('.profile-personal-space').count(), 1);
  assert.equal(await panel.locator('.panel-footer').count(), 0);
  assert.equal(await panel.locator('a[href="https://www.linkedin.com/in/santiago-yepes-mesa-67ab80270"]').count(), 1);
  assert.equal(await panel.locator('a[href="https://github.com/Laughcheeta1"]').count(), 1);
  console.log('PASS: About panel keeps the Nietzsche quote, reserves personal-note space, and exposes only LinkedIn/GitHub links.');

  await page.evaluate(() => window.__visit(3, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('[data-testid="profile-memory-panel"]').waitFor();
  assert.equal(await panel.locator('iframe[title="YouTube player for Baile Inolvidable - Bad Bunny"]').count(), 1);
  assert.equal(await panel.locator('iframe').getAttribute('src'), 'https://www.youtube-nocookie.com/embed/a1Femq4NPxs?list=RDa1Femq4NPxs&start=1');
  assert.match(await panel.textContent(), /Fun fact:/);
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.equal(await panel.locator('.profile-memory__seal').count(), 0);
  assert.equal(await panel.locator('figcaption').count(), 0);
  assert.equal(await panel.locator('a[href*="youtube.com/watch"]').count(), 0);
  assert.equal(await panel.locator('.profile-memory__story').textContent(), 'I paid 366 USD just to be able to go to his concert and hear it live ... I would do it again.');
  assert.equal(await panel.locator('.profile-memory__ellipsis').count(), 0);
  assert.equal(await panel.locator('.profile-memory__closing').count(), 0);
  console.log('PASS: profile rear panel renders the song player, concert memory, and closing line.');

  await page.evaluate(() => window.__visit(4));
  panel = page.locator('.world-panel:visible');
  const achievementField = panel.getByTestId('achievement-field');
  await achievementField.waitFor();
  assert.equal(await achievementField.locator('img, image').count(), 0, 'Awards scenery must be recreated in frontend graphics.');
  assert.equal(await panel.locator('.panel-intro, .panel-medal').count(), 0);
  assert.equal(await achievementField.getByTestId('achievement-relic').count(), 5);
  assert.equal(await achievementField.getByTestId('achievement-column').count(), 5);
  assert.equal(await panel.locator('.achievement-card').count(), 0);
  assert.equal(await achievementField.getByTestId('achievement-relic').evaluateAll(relics => relics.every(relic => relic.getAttribute('data-state') === 'resting')), true);

  const firstRelic = achievementField.getByTestId('achievement-relic').first();
  const firstObject = firstRelic.getByTestId('achievement-object');
  const restingBox = await firstObject.boundingBox();
  assert.ok(restingBox?.width);
  await firstObject.click();

  const featuredAward = achievementField.getByTestId('achievement-featured');
  const awardDetails = achievementField.getByTestId('achievement-details');
  await featuredAward.waitFor();
  await awardDetails.waitFor();
  assert.equal(await firstRelic.getAttribute('data-state'), 'featured');
  assert.equal(await firstObject.getAttribute('aria-pressed'), 'true');
  assert.ok(await featuredAward.isVisible());
  assert.equal(await featuredAward.getAttribute('data-state'), 'featured');
  assert.equal(await achievementField.locator('.awards-scene > g > svg[opacity="0"]').count(), 1, 'Selected relic leaves its column.');
  assert.ok(await featuredAward.locator('svg path').count() > 0, 'Featured relic contains frontend geometry.');
  assert.ok((await awardDetails.getByTestId('achievement-details-title').textContent()).trim());
  assert.ok((await awardDetails.getByTestId('achievement-details-copy').textContent()).trim());
  assert.match(await awardDetails.evaluate(element => getComputedStyle(element).backgroundColor), /rgba\(/);

  const achievementBounds = await achievementField.boundingBox();
  await page.mouse.click(achievementBounds.x + 8, achievementBounds.y + 8);
  assert.equal(await achievementField.getByTestId('achievement-featured').count(), 0);
  assert.equal(await achievementField.getByTestId('achievement-details').count(), 0);
  assert.equal(await firstRelic.getAttribute('data-state'), 'resting');
  assert.equal(await firstObject.getAttribute('aria-pressed'), 'false');
  assert.equal(await achievementField.locator('.awards-scene > g > svg[opacity="0"]').count(), 0, 'Dismissed relic returns to its column.');
  console.log('PASS: Awards grove renders five relics, features clicked objects, shows translucent details, and restores on click-outside.');

  await page.evaluate(() => window.__visit(4, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'A different kind of achievement.' }).waitFor();
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.match(await panel.locator('.secret-panel__copy').first().textContent(), /my greatest achievement comes to me/);
  assert.match(await panel.locator('.secret-panel__copy--secondary').textContent(), /university hackathons/);
  assert.equal(await panel.locator('.secret-panel__signature').count(), 0);
  console.log('PASS: Achievements rear panel renders both personal achievement reflections.');

  await page.evaluate(() => window.__visit(5));
  panel = page.locator('.world-panel:visible');
  await panel.locator('[data-testid="hobby-sky"]').waitFor();
  assert.equal(await panel.locator('.hobby-sky img, .hobby-sky image').count(), 0, 'Hobbies scenery must not embed the reference image.');
  assert.equal(await panel.locator('.panel-intro').count(), 0);
  assert.ok(await panel.locator('.hobby-sky canvas').evaluate(canvas => canvas.getContext('2d').getImageData(450, 800, 1, 1).data[3] > 0), 'Procedural lookout is painted.');
  const hobbyStars = panel.locator('[data-testid="hobby-star"]');
  assert.equal(await hobbyStars.count(), 5);
  assert.deepEqual(await hobbyStars.evaluateAll(stars => stars.map(star => star.getAttribute('data-hobby-id'))), [
    'learning', 'gym', 'gifts', 'motorcycle', 'working',
  ]);
  assert.equal(await hobbyStars.evaluateAll(stars => stars.every(star => star.getAttribute('aria-pressed') === 'false')), true);
  assert.equal(await panel.locator('.hobby-card').count(), 0);
  assert.equal(await panel.locator('.bench-game').count(), 0);
  const hobbyStar = panel.locator('[data-hobby-id="learning"]');
  await hobbyStar.hover();
  await panel.locator('[data-testid="hobby-details"]').waitFor();
  assert.equal(await hobbyStar.getAttribute('aria-pressed'), 'true');
  assert.match(await panel.locator('[data-testid="hobby-details"]').textContent(), /Learning new things/);
  const hobbyDetails = panel.getByTestId('hobby-details');
  const starBounds = await hobbyStar.boundingBox();
  const detailBounds = await hobbyDetails.boundingBox();
  assert.ok(detailBounds.y >= starBounds.y + starBounds.height - 2, 'Details appear beneath their star.');
  assert.doesNotMatch(await hobbyDetails.textContent(), /signal received/i);
  await page.mouse.move(starBounds.x + starBounds.width / 2, detailBounds.y + 2, { steps: 8 });
  await hobbyDetails.hover();
  assert.equal(await hobbyStar.getAttribute('aria-pressed'), 'true', 'Details stay open while hovered.');
  await hobbyDetails.focus();
  assert.equal(await hobbyDetails.count(), 1, 'Keyboard focus can move into the scrollable details.');
  await hobbyStar.focus();
  assert.equal(await hobbyStar.getAttribute('aria-describedby'), 'hobby-detail-learning');
  await page.mouse.move(20, 400);
  assert.equal(await panel.locator('[data-testid="hobby-details"]').count(), 0);
  console.log('PASS: hobbies panel renders a five-star night lookout with hover and keyboard-accessible details.');

  await page.evaluate(() => window.__visit(5, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('[data-testid="fitness-stats-panel"]').waitFor();
  assert.equal(await panel.locator('[data-testid="fitness-stat"]').count(), 7);
  assert.equal(await panel.locator('.panel-eyebrow').count(), 0);
  assert.equal(await panel.locator('.fitness-stats__emblem').count(), 0);
  assert.equal(await panel.locator('.fitness-stat__head, .fitness-stat__index, .fitness-stat__category').count(), 0);
  assert.equal(await panel.locator('.fitness-stats__signature').count(), 0);
  assert.equal(await panel.locator('.fitness-stat p').count(), 3);
  assert.doesNotMatch(await panel.textContent(), /A heavy pull|Leg day has entered the chat|Two clean repetitions|after years away from a real bicycle|keep showing up/i);
  assert.match(await panel.locator('.fitness-stats__copy').textContent(), /There is still a lot of room to grow/);
  assert.equal(await panel.getByText('120 kg', { exact: true }).count(), 1);
  assert.equal(await panel.getByText('75 kg × 2 reps', { exact: true }).count(), 1);
  assert.equal(await panel.getByText('61 km', { exact: true }).count(), 1);
  assert.equal(await panel.getByText('25 m', { exact: true }).count(), 1);
  console.log('PASS: hobbies rear panel renders seven accessible fitness stats with the growth-focused training design.');

  await page.evaluate(() => window.__visit(6));
  panel = page.locator('.world-panel:visible');
  assert.equal(await panel.getByText('Go Big or Go Home', { exact: true }).count(), 1);
  assert.equal(await panel.getByText('Changing how the world works', { exact: true }).count(), 1);
  assert.equal(await panel.getByText('Startup currently in stealth mode', { exact: true }).count(), 1);
  assert.equal(await panel.locator('.panel-columns, .panel-note, .panel-status').count(), 0);
  console.log('PASS: Library of Pergamon displays the requested world-changing phrase.');

  await page.evaluate(() => window.__visit(6, 'back'));
  panel = page.locator('.world-panel:visible');
  await panel.locator('h1').filter({ hasText: 'I WILL BE REMEMBERED BY HISTORY' }).waitFor();
  assert.equal(await panel.locator('.secret-panel__icon').count(), 1);
  assert.equal(await panel.locator('.secret-panel__copy, .secret-panel__copy--secondary, .secret-panel__signature, .panel-eyebrow').count(), 0);
  assert.equal(await panel.locator('.secret-panel__icon').textContent(), '📜');
  assert.equal(await panel.locator('.secret-panel__signature').count(), 0);
  console.log('PASS: Library of Pergamon rear panel keeps only its document mark and history title.');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const index of [0, 1, 2, 3, 4, 5, 6]) {
      await page.evaluate(index => window.__visit(index), index);
      const visible = page.locator('.world-panel:visible');
      await visible.evaluate(el => { el.scrollTop = 0; });
      assert.ok(await visible.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      await page.screenshot({ path: `/tmp/portfolio-panel-${index}-${width}.png` });
    }
  }
  await page.setViewportSize({ width: 1000, height: 800 });
  console.log('PASS: React panels fit 320px and 390px viewports without horizontal overflow.');

  for (let index = 0; index < 7; index++) for (const side of ['front', 'back']) {
    await page.evaluate(({ index, side }) => window.__visit(index, side), { index, side });
    const visible = page.locator('.world-panel:visible');
    assert.equal(await visible.count(), 1);
    assert.equal(await visible.locator('h1').count(), 1);
    assert.equal(await visible.locator('.panel-footer').count(), 0);
    assert.equal(await visible.locator('iframe').count(), index === 3 && side === 'back' ? 1 : 0);
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
