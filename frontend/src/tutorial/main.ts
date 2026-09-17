import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { config } from '../config';
import { createOrientationTip, isSmallViewport } from '../orientation';
import { Input } from '../input';
import { Player } from '../world/actors';
import { damping } from '../world/physics';
import { getLanguage, onLanguageChange } from '../i18n';
import { createLanguageMenu } from '../i18n/LanguageMenu';
import { getTutorialCopy, type FingerId } from './i18n';
import { isInFrontalCone, isTutorialComplete, joystickMatchesStep, keyMatchesStep, nextStepIndex, tutorialSteps } from './state';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#tutorial-app');
if (!app) throw new Error('Tutorial host is missing.');

const homeUrl = new URL('../', document.baseURI).toString();
const handImageUrl = new URL('../../assets/tutorial-hand.png', import.meta.url).href;
const tutorialChoiceKey = 'portfolio.tutorial.v1.choice';
const roomCenter = { x: -23, z: 0 } as const;
const initialCopy = getTutorialCopy(getLanguage());

app.innerHTML = `<main class="tutorial-shell" aria-label="${initialCopy.shellLabel}">
  <div id="tutorial-world"></div>
  <header class="tutorial-header">
    <a class="tutorial-brand" href="${homeUrl}" aria-label="${initialCopy.brandLabel}"><span class="tutorial-brand__mark">✳</span><span><span id="tutorial-brand-name">${initialCopy.brandName}</span><small>${initialCopy.brandCaption}</small></span></a>
    <div class="tutorial-header__title"><span>${initialCopy.headerEyebrow}</span><strong>${initialCopy.headerTitle}</strong></div>
    <div class="tutorial-header__controls"><div id="tutorial-language"></div><div class="tutorial-progress" aria-label="${initialCopy.progressLabel}"><span id="tutorial-step-count">01 / 07</span><div class="tutorial-progress__track"><span id="tutorial-progress-fill"></span></div></div></div>
  </header>

  <section class="tutorial-card" aria-live="polite" aria-atomic="true">
    <span id="tutorial-eyebrow" class="tutorial-eyebrow">${initialCopy.stepLabel} 01 · ${initialCopy.steps.forward.category}</span>
    <h1 id="tutorial-title">${initialCopy.steps.forward.title}</h1>
    <p id="tutorial-copy">${initialCopy.steps.forward.body}</p>
    <p id="tutorial-touch-note" class="tutorial-touch-note">${initialCopy.touchControlsHint}</p>
    <div id="tutorial-key-prompt" class="tutorial-key-prompt"><kbd>${initialCopy.steps.forward.keyLabel}</kbd><span>${initialCopy.promptTurn}</span></div>
    <p id="tutorial-feedback" class="tutorial-feedback" role="status"></p>
    <div id="tutorial-focus-progress" class="tutorial-focus-progress" hidden><span class="focus-dot"></span><span><strong id="tutorial-focus-count">0 / 4</strong> <span id="tutorial-focus-label">${initialCopy.focusLabel}</span></span></div>
    <div class="tutorial-route"><span id="tutorial-route-heading">${initialCopy.routeHeading}</span><ol id="tutorial-steps"></ol></div>
  </section>

  <aside id="tutorial-finger-guide" class="finger-guide" aria-label="${initialCopy.fingerGuide.diagramLabel}">
    <div class="finger-guide__heading"><span id="tutorial-finger-eyebrow" class="tutorial-eyebrow">${initialCopy.fingerGuide.eyebrow}</span><strong id="tutorial-finger-title">${initialCopy.fingerGuide.title}</strong></div>
    <div id="tutorial-keyboard-diagram" class="keyboard-diagram" aria-label="${initialCopy.fingerGuide.diagramLabel}">
      <div class="keyboard-keys">
        <div class="keyboard-row keyboard-row--wasd"><span class="keyboard-spacer"></span><kbd data-finger-key="w" data-key-label="w">W</kbd><span class="keyboard-spacer"></span></div>
        <div class="keyboard-row keyboard-row--wasd"><kbd data-finger-key="a" data-key-label="a">A</kbd><kbd data-finger-key="s" data-key-label="s">S</kbd><kbd data-finger-key="d" data-key-label="d">D</kbd></div>
        <div class="keyboard-row keyboard-row--actions"><kbd data-finger-key="shift" data-key-label="shift">shift</kbd><kbd data-finger-key="space" data-key-label="space">space</kbd></div>
      </div>
      <img id="tutorial-hand" class="tutorial-hand" src="${handImageUrl}" alt="${initialCopy.fingerGuide.handAlt}">
    </div>
    <div id="tutorial-finger-legend" class="finger-legend"></div>
  </aside>

  <div id="tutorial-camera-hint" class="tutorial-camera-hint" hidden><span class="tutorial-crosshair" aria-hidden="true">+</span><span id="tutorial-camera-hint-label">${initialCopy.cameraHint}</span></div>
  <div id="tutorial-stick" class="tutorial-stick" aria-label="${initialCopy.touchMoveLabel}" role="application"><span></span></div>
  <button id="tutorial-run" class="tutorial-touch-button tutorial-touch-button--run" type="button" aria-label="${initialCopy.touchRunLabel}" aria-pressed="false">${initialCopy.touchRunText}</button>
  <button id="tutorial-jump" class="tutorial-touch-button tutorial-touch-button--jump" type="button" aria-label="${initialCopy.touchJumpLabel}">${initialCopy.touchJumpLabel.toUpperCase()}</button>

  <section id="tutorial-complete" class="tutorial-complete" hidden>
    <span id="tutorial-complete-eyebrow" class="tutorial-eyebrow">${initialCopy.complete.eyebrow}</span>
    <h2 id="tutorial-complete-title">${initialCopy.complete.title}</h2>
    <p id="tutorial-complete-copy">${initialCopy.complete.body}</p>
    <a id="tutorial-enter" class="tutorial-primary" href="${homeUrl}"><span id="tutorial-enter-label">${initialCopy.complete.enter}</span> <span aria-hidden="true">↗</span></a>
  </section>
  <p id="tutorial-notice" class="tutorial-notice" role="status"></p>
</main>`;

const orientationTip = createOrientationTip(app, initialCopy.orientation, 'tutorial-orientation-tip');

const world = document.querySelector<HTMLElement>('#tutorial-world')!;
const canvasHost = world;
const tutorialCard = document.querySelector<HTMLElement>('.tutorial-card')!;
const title = document.querySelector<HTMLElement>('#tutorial-title')!;
const eyebrow = document.querySelector<HTMLElement>('#tutorial-eyebrow')!;
const copy = document.querySelector<HTMLElement>('#tutorial-copy')!;
const touchNote = document.querySelector<HTMLElement>('#tutorial-touch-note')!;
const keyPrompt = document.querySelector<HTMLElement>('#tutorial-key-prompt')!;
const feedback = document.querySelector<HTMLElement>('#tutorial-feedback')!;
const stepCount = document.querySelector<HTMLElement>('#tutorial-step-count')!;
const progressFill = document.querySelector<HTMLElement>('#tutorial-progress-fill')!;
const route = document.querySelector<HTMLOListElement>('#tutorial-steps')!;
const focusProgress = document.querySelector<HTMLElement>('#tutorial-focus-progress')!;
const focusCount = document.querySelector<HTMLElement>('#tutorial-focus-count')!;
const focusLabel = document.querySelector<HTMLElement>('#tutorial-focus-label')!;
const cameraHint = document.querySelector<HTMLElement>('#tutorial-camera-hint')!;
const cameraHintLabel = document.querySelector<HTMLElement>('#tutorial-camera-hint-label')!;
const fingerGuide = document.querySelector<HTMLElement>('#tutorial-finger-guide')!;
const fingerEyebrow = document.querySelector<HTMLElement>('#tutorial-finger-eyebrow')!;
const fingerTitle = document.querySelector<HTMLElement>('#tutorial-finger-title')!;
const keyboardDiagram = document.querySelector<HTMLElement>('#tutorial-keyboard-diagram')!;
const hand = document.querySelector<HTMLImageElement>('#tutorial-hand')!;
const fingerLegend = document.querySelector<HTMLElement>('#tutorial-finger-legend')!;
const completeEyebrow = document.querySelector<HTMLElement>('#tutorial-complete-eyebrow')!;
const completeTitle = document.querySelector<HTMLElement>('#tutorial-complete-title')!;
const completeCopy = document.querySelector<HTMLElement>('#tutorial-complete-copy')!;
const enterLabel = document.querySelector<HTMLElement>('#tutorial-enter-label')!;
const languageControl = createLanguageMenu();
languageControl.classList.add('tutorial-language-menu');
document.querySelector<HTMLElement>('#tutorial-language')!.append(languageControl);
const completeCard = document.querySelector<HTMLElement>('#tutorial-complete')!;
const notice = document.querySelector<HTMLElement>('#tutorial-notice')!;
const runButton = document.querySelector<HTMLButtonElement>('#tutorial-run')!;
const jumpButton = document.querySelector<HTMLButtonElement>('#tutorial-jump')!;
const stick = document.querySelector<HTMLElement>('#tutorial-stick')!;
const fingerOrder: FingerId[] = ['index', 'middle', 'ring', 'thumb', 'little'];

let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch {
  world.innerHTML = `<div class="tutorial-webgl-error"><h1>${initialCopy.webglError.title}</h1><p>${initialCopy.webglError.body} <a href="${homeUrl}">${initialCopy.webglError.home}</a>.</p></div>`;
  throw new Error('WebGL is not available');
}

renderer.setPixelRatio(Math.min(devicePixelRatio, isSmallViewport() ? config.performance.mobileDpr : config.performance.maxDpr));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .92;
renderer.domElement.setAttribute('tabindex', '0');
renderer.domElement.setAttribute('aria-label', initialCopy.canvasLabel);
world.append(renderer.domElement);
languageControl.addEventListener('click', event => {
  if (!(event.target instanceof Element) || !event.target.closest('[data-language]')) return;
  window.setTimeout(() => renderer.domElement.focus(), 0);
});

const scene = new THREE.Scene();
scene.background = new THREE.Color('#d8c9ad');
scene.fog = new THREE.Fog('#d8c9ad', 54, 112);
const pmrem = new THREE.PMREMGenerator(renderer);
const studio = new RoomEnvironment();
scene.environment = pmrem.fromScene(studio).texture;
scene.environmentIntensity = .28;
studio.dispose();
pmrem.dispose();

const addBox = (group: THREE.Group, size: [number, number, number], position: [number, number, number], material: THREE.Material) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
};
const room = new THREE.Group();
room.name = 'tutorial-bank-space';
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#cbbd9f', roughness: .9 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#eee5d1', roughness: .88 });
const trimMaterial = new THREE.MeshStandardMaterial({ color: '#59766a', roughness: .64 });
addBox(room, [58, .45, 40], [roomCenter.x, -.23, roomCenter.z], floorMaterial);
addBox(room, [58, 12, .38], [roomCenter.x, 5.8, -20], wallMaterial);
addBox(room, [58, 12, .38], [roomCenter.x, 5.8, 20], wallMaterial);
addBox(room, [.38, 12, 40], [-52, 5.8, roomCenter.z], wallMaterial);
addBox(room, [.38, 12, 40], [6, 5.8, roomCenter.z], wallMaterial);
addBox(room, [58, 1.5, .5], [roomCenter.x, 8.7, -19.7], trimMaterial);
const floorGrid = new THREE.GridHelper(58, 29, '#9d8f78', '#c0b295');
floorGrid.position.set(roomCenter.x, .012, roomCenter.z);
(floorGrid.material as THREE.Material).transparent = true;
(floorGrid.material as THREE.Material).opacity = .34;
room.add(floorGrid);
scene.add(room);

const ambient = new THREE.HemisphereLight('#fff7e4', '#667a6d', 1.85);
const sunLight = new THREE.DirectionalLight('#fff0c7', 3.1);
sunLight.position.set(-23, 18, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.setScalar(1024);
Object.assign(sunLight.shadow.camera, { left: -34, right: 34, top: 30, bottom: -30, near: 1, far: 90 });
sunLight.shadow.bias = -.001;
scene.add(ambient, sunLight, sunLight.target);

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 20), new THREE.MeshStandardMaterial({ color: '#ffd56e', emissive: '#f2a72f', emissiveIntensity: .75, roughness: .42, metalness: .02 }));
sun.name = 'tutorial-sun';
sun.position.set(-23, 7.4, 0);
sun.castShadow = true;
scene.add(sun);

const player = new Player(false, []);
player.model.position.set(roomCenter.x, 0, roomCenter.z + 1);
scene.add(player.model);
sunLight.target = player.model;

const camera = new THREE.PerspectiveCamera(config.camera.fov, innerWidth / innerHeight, config.camera.near, config.camera.far);
const input = new Input(renderer.domElement, stick, () => renderer.domElement.focus());
input.yaw = .34;
input.pitch = config.camera.pitch;
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
function updateCamera(dt: number, immediate = false) {
  cameraTarget.copy(player.model.position).y += config.camera.height;
  desiredCamera.set(
    Math.sin(input.yaw) * Math.cos(input.pitch) * config.camera.distance,
    Math.sin(input.pitch) * config.camera.distance,
    Math.cos(input.yaw) * Math.cos(input.pitch) * config.camera.distance,
  ).add(cameraTarget);
  camera.position.lerp(desiredCamera, immediate ? 1 : damping(config.camera.smoothing, dt));
  camera.lookAt(cameraTarget);
}
updateCamera(0, true);

type FocusBallId = 'front' | 'behind' | 'left' | 'right';
type FocusBall = { id: FocusBallId; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; focused: boolean };
const focusBalls: FocusBall[] = [];
const focusBallGeometry = new THREE.SphereGeometry(.58, 28, 18);
const focusDirections: Array<{ id: FocusBallId; x: number; z: number }> = [
  { id: 'front', x: 0, z: -1 },
  { id: 'behind', x: 0, z: 1 },
  { id: 'left', x: -1, z: 0 },
  { id: 'right', x: 1, z: 0 },
];
for (const direction of focusDirections) {
  const material = new THREE.MeshStandardMaterial({ color: '#e45652', emissive: '#6c1d22', emissiveIntensity: .58, roughness: .38 });
  const mesh = new THREE.Mesh(focusBallGeometry, material);
  mesh.name = `tutorial-focus-ball-${direction.id}`;
  mesh.castShadow = true;
  mesh.visible = false;
  scene.add(mesh);
  focusBalls.push({ id: direction.id, mesh, material, focused: false });
}
function placeFocusBalls() {
  for (const ball of focusBalls) {
    const direction = focusDirections.find(item => item.id === ball.id)!;
    ball.mesh.position.set(player.model.position.x + direction.x * 9, 2.35, player.model.position.z + direction.z * 9);
    ball.focused = false;
    ball.material.color.set('#e45652');
    ball.material.emissive.set('#6c1d22');
    ball.mesh.visible = true;
  }
}

let currentStep = 0;
let previous = performance.now();
let time = 0;
let completionJumpPending = false;
let noticeTimeout: ReturnType<typeof setTimeout> | undefined;
const viewDirection = new THREE.Vector3();
const projectedBall = new THREE.Vector3();

function currentTutorialStep() {
  return tutorialSteps[currentStep];
}
function showNotice(message: string) {
  notice.textContent = message;
  notice.classList.add('is-visible');
  if (noticeTimeout) clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => notice.classList.remove('is-visible'), 2600);
}
function setActiveFinger(key: string | undefined) {
  for (const keycap of document.querySelectorAll<HTMLElement>('[data-finger-key]')) keycap.classList.toggle('is-active', keycap.dataset.fingerKey === key);
}
function renderLanguage() {
  const language = getLanguage();
  const strings = getTutorialCopy(language);
  document.documentElement.lang = language;
  document.title = strings.pageTitle;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', strings.metaDescription);
  document.querySelector<HTMLElement>('.tutorial-shell')!.setAttribute('aria-label', strings.shellLabel);
  document.querySelector<HTMLElement>('.tutorial-brand')!.setAttribute('aria-label', strings.brandLabel);
  document.querySelector<HTMLElement>('#tutorial-brand-name')!.textContent = strings.brandName;
  document.querySelector<HTMLElement>('.tutorial-brand small')!.textContent = strings.brandCaption;
  document.querySelector<HTMLElement>('.tutorial-header__title span')!.textContent = strings.headerEyebrow;
  document.querySelector<HTMLElement>('.tutorial-header__title strong')!.textContent = strings.headerTitle;
  document.querySelector<HTMLElement>('.tutorial-progress')!.setAttribute('aria-label', strings.progressLabel);
  touchNote.textContent = strings.touchControlsHint;
  orientationTip.setCopy(strings.orientation);
  focusLabel.textContent = strings.focusLabel;
  document.querySelector<HTMLElement>('#tutorial-route-heading')!.textContent = strings.routeHeading;
  cameraHintLabel.textContent = strings.cameraHint;
  stick.setAttribute('aria-label', strings.touchMoveLabel);
  runButton.setAttribute('aria-label', strings.touchRunLabel);
  runButton.textContent = strings.touchRunText;
  jumpButton.setAttribute('aria-label', strings.touchJumpLabel);
  jumpButton.textContent = strings.touchJumpLabel.toUpperCase();
  fingerGuide.setAttribute('aria-label', strings.fingerGuide.diagramLabel);
  fingerEyebrow.textContent = strings.fingerGuide.eyebrow;
  fingerTitle.textContent = strings.fingerGuide.title;
  keyboardDiagram.setAttribute('aria-label', strings.fingerGuide.diagramLabel);
  hand.alt = strings.fingerGuide.handAlt;
  const keyLabels = new Map(fingerOrder.map(id => [strings.fingerGuide.fingers[id].key, strings.fingerGuide.fingers[id].keyLabel]));
  for (const keycap of keyboardDiagram.querySelectorAll<HTMLElement>('[data-key-label]')) {
    const keyLabel = keyLabels.get(keycap.dataset.keyLabel ?? '');
    if (keyLabel) keycap.textContent = keyLabel;
  }
  fingerLegend.innerHTML = fingerOrder.map(id => {
    const finger = strings.fingerGuide.fingers[id];
    return `<div class="finger-legend__item finger-legend__item--${id}"><span class="finger-legend__finger" aria-hidden="true"></span><span><strong>${finger.name}</strong><small>${strings.fingerGuide.in} <kbd>${finger.keyLabel}</kbd></small></span></div>`;
  }).join('');
  completeEyebrow.textContent = strings.complete.eyebrow;
  completeTitle.textContent = strings.complete.title;
  completeCopy.textContent = strings.complete.body;
  enterLabel.textContent = strings.complete.enter;
  notice.classList.remove('is-visible');
  renderStage();
  renderer.domElement.setAttribute('aria-label', strings.canvasLabel);
}
function renderRoute() {
  const strings = getTutorialCopy(getLanguage());
  route.innerHTML = tutorialSteps.map((step, index) => `<li data-step="${step.id}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${strings.steps[step.id].route}</strong></li>`).join('');
  for (const [index, element] of [...route.children].entries()) {
    element.classList.toggle('is-complete', index < currentStep);
    element.classList.toggle('is-current', index === currentStep && !isTutorialComplete(currentStep));
    if (index === currentStep && !isTutorialComplete(currentStep)) element.setAttribute('aria-current', 'step');
    else element.removeAttribute('aria-current');
  }
}
function renderStage() {
  const step = currentTutorialStep();
  const strings = getTutorialCopy(getLanguage());
  renderRoute();
  if (!step) return;
  const index = currentStep + 1;
  const isCamera = step.id === 'camera';
  stepCount.textContent = `${String(index).padStart(2, '0')} / ${String(tutorialSteps.length).padStart(2, '0')}`;
  progressFill.style.width = `${(currentStep / tutorialSteps.length) * 100}%`;
  const stepCopy = strings.steps[step.id];
  eyebrow.textContent = `${strings.stepLabel} ${String(index).padStart(2, '0')} · ${stepCopy.category}`;
  const touchDevice = matchMedia('(pointer: coarse)').matches;
  title.textContent = touchDevice ? stepCopy.touchTitle : stepCopy.title;
  copy.textContent = touchDevice ? stepCopy.touchBody : stepCopy.body;
  keyPrompt.hidden = touchDevice;
  keyPrompt.innerHTML = isCamera ? `<span class="drag-key">↔</span><span>${strings.promptDrag}</span>` : `<kbd>${stepCopy.keyLabel}</kbd><span>${strings.promptTurn}</span>`;
  keyPrompt.classList.toggle('is-camera', isCamera);
  focusProgress.hidden = !isCamera;
  cameraHint.hidden = !isCamera;
  for (const ball of focusBalls) ball.mesh.visible = isCamera;
  if (isCamera && !focusBalls.some(ball => ball.mesh.visible)) placeFocusBalls();
  setActiveFinger(isCamera ? undefined : step.keyLabel.toLowerCase());
  feedback.textContent = '';
  tutorialCard.dataset.stage = step.id;
}
function renderFocusProgress() {
  const focused = focusBalls.filter(ball => ball.focused).length;
  focusCount.textContent = `${focused} / ${focusBalls.length}`;
  focusProgress.classList.toggle('is-ready', focused === focusBalls.length);
}
function finishTutorial(demonstrateJump = false) {
  input.clear();
  if (demonstrateJump) {
    input.requestJump();
    completionJumpPending = true;
  }
  player.velocity.set(0, 0);
  completeCard.hidden = false;
  tutorialCard.hidden = true;
  document.body.classList.add('tutorial-is-complete');
  progressFill.style.width = '100%';
  stepCount.textContent = `${String(tutorialSteps.length).padStart(2, '0')} / ${String(tutorialSteps.length).padStart(2, '0')}`;
  renderRoute();
  window.localStorage.setItem(tutorialChoiceKey, 'complete');
  showNotice(getTutorialCopy(getLanguage()).notices.complete);
}
function advanceStep() {
  if (isTutorialComplete(currentStep)) return;
  const completedStep = currentTutorialStep();
  currentStep = nextStepIndex(currentStep);
  if (isTutorialComplete(currentStep)) {
    finishTutorial(completedStep?.id === 'jump');
    return;
  }
  if (currentTutorialStep()?.id === 'camera') placeFocusBalls();
  renderStage();
}

function registerKey(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const step = currentTutorialStep();
  if (!step || step.kind !== 'key') return;
  if (keyMatchesStep(step, event.code)) {
    const strings = getTutorialCopy(getLanguage());
    feedback.textContent = step.id === 'jump' ? strings.feedback.jumpSuccess : strings.feedback.success;
    advanceStep();
    return;
  }
  const movementKey = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code);
  if (movementKey || event.code === 'Space' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    feedback.textContent = getTutorialCopy(getLanguage()).feedback.wrong(getTutorialCopy(getLanguage()).steps[step.id].keyLabel);
  }
}
window.addEventListener('keydown', registerKey);

let runPointer: number | null = null;
runButton.addEventListener('pointerdown', event => {
  if (runPointer !== null) return;
  event.preventDefault();
  runPointer = event.pointerId;
  runButton.setPointerCapture(event.pointerId);
  input.keys.add('ShiftLeft');
  if (currentTutorialStep()?.id === 'run') advanceStep();
  runButton.setAttribute('aria-pressed', 'true');
});
const releaseRun = () => {
  runPointer = null;
  input.keys.delete('ShiftLeft');
  runButton.setAttribute('aria-pressed', 'false');
};
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) runButton.addEventListener(type, releaseRun);
window.addEventListener('blur', releaseRun);
document.addEventListener('visibilitychange', releaseRun);

function requestTutorialJump() {
  input.requestJump();
  if (currentTutorialStep()?.id === 'jump') advanceStep();
}
jumpButton.addEventListener('pointerdown', event => { event.preventDefault(); requestTutorialJump(); });
jumpButton.addEventListener('click', event => { if (event.detail === 0) requestTutorialJump(); });

document.querySelector<HTMLAnchorElement>('#tutorial-enter')!.addEventListener('click', () => window.localStorage.setItem(tutorialChoiceKey, 'complete'));
onLanguageChange(renderLanguage);
renderLanguage();

function updateFocus() {
  if (currentTutorialStep()?.id !== 'camera') return;
  camera.getWorldDirection(viewDirection);
  const viewHorizontal = { x: viewDirection.x, z: viewDirection.z };
  for (const ball of focusBalls) {
    if (ball.focused) continue;
    projectedBall.copy(ball.mesh.position).project(camera);
    const centered = isInFrontalCone(player.model.position, ball.mesh.position, viewHorizontal);
    const visible = projectedBall.z > -1 && projectedBall.z < 1 && Math.abs(projectedBall.x) < .18;
    if (centered && visible) {
      ball.focused = true;
      ball.material.color.set('#70d98b');
      ball.material.emissive.set('#1f743a');
      const strings = getTutorialCopy(getLanguage());
      showNotice(strings.notices.focused(strings.spheres[ball.id]));
      renderFocusProgress();
      if (focusBalls.every(item => item.focused)) {
        feedback.textContent = strings.feedback.cameraComplete;
        advanceStep();
      }
    }
  }
}

function updateTouchMovement() {
  const step = currentTutorialStep();
  if (!step || !['forward', 'backward', 'left', 'right'].includes(step.id)) return;
  if (joystickMatchesStep(step.id, input.joystick)) advanceStep();
}

function frame(now: number) {
  const dt = Math.min((now - previous) / 1000, config.performance.maxDelta);
  previous = now;
  time += dt;
  updateTouchMovement();
  if (!isTutorialComplete(currentStep) || completionJumpPending || !player.grounded) {
    player.update(input, dt, time);
    if (completionJumpPending && !player.grounded) completionJumpPending = false;
  }
  updateCamera(dt);
  sunLight.target.position.copy(player.model.position);
  updateFocus();
  if (!config.animation.reducedMotion) {
    sun.rotation.y += dt * .08;
    sun.position.y = 7.4 + Math.sin(time * .45) * .12;
    for (const ball of focusBalls) ball.mesh.position.y = 2.35 + Math.sin(time * 1.4 + focusDirections.findIndex(direction => direction.id === ball.id)) * .08;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmallViewport() ? config.performance.mobileDpr : config.performance.maxDpr));
  renderer.setSize(innerWidth, innerHeight);
});
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  showNotice('The graphics connection was interrupted. Reload to restart the field guide.');
});

Object.defineProperty(window, 'tutorialDebug', { get: () => ({
  step: currentTutorialStep()?.id ?? 'complete',
  stepIndex: currentStep,
  complete: isTutorialComplete(currentStep),
  focusedBalls: focusBalls.filter(ball => ball.focused).map(ball => ball.id),
  player: { x: player.model.position.x, y: player.model.position.y, z: player.model.position.z, grounded: player.grounded },
  camera: { yaw: input.yaw, pitch: input.pitch },
}) });
