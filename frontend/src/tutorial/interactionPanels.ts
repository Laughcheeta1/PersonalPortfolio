import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { isolatePanel } from '../panels';
import type { TutorialInteractionCopy } from './i18n';

export type TutorialInteractionStep = 'model' | 'guide' | null;

export interface TutorialInteractionCallbacks {
  onModelClick: () => void;
  onModelContinue: () => void;
  onGuideMessage: (message: string) => void;
  onGuideContinue: () => void;
}

export interface TutorialInteractionPresence {
  modelNear: boolean;
  guideNear: boolean;
}

const modelActivationRadius = 8;
const guideActivationRadius = 3.8;
const modelPanelWidth = 560;
const modelPanelHeight = 430;
const guidePanelWidth = 500;
const guidePanelHeight = 420;

export class TutorialInteractionPanels {
  private readonly modelElement = document.createElement('article');
  private readonly guideElement = document.createElement('article');
  private readonly modelObject: CSS3DObject;
  private readonly guideObject: CSS3DObject;
  private readonly modelContinue: HTMLButtonElement;
  private readonly modelStatus: HTMLElement;
  private readonly guideLog: HTMLElement;
  private readonly guideForm: HTMLFormElement;
  private readonly guideInput: HTMLInputElement;
  private readonly guideSend: HTMLButtonElement;
  private readonly guideStatus: HTMLElement;
  private readonly guideContinue: HTMLButtonElement;
  private readonly callbacks: TutorialInteractionCallbacks;
  private readonly modelPanelAnchor = new THREE.Vector3();
  private activeStep: TutorialInteractionStep = null;
  private modelClicked = false;
  private guideMessageSent = false;

  constructor(scene: THREE.Scene, callbacks: TutorialInteractionCallbacks) {
    this.callbacks = callbacks;

    this.modelElement.className = 'tutorial-interaction-panel tutorial-model-panel';
    this.modelElement.setAttribute('aria-label', 'Rocket interaction panel');
    this.modelElement.innerHTML = `<div class="tutorial-interaction-panel__header">
      <span class="tutorial-interaction-panel__eyebrow" data-role="model-eyebrow"></span>
      <h2 data-role="model-title"></h2>
    </div>
    <div class="tutorial-interaction-panel__scroll" data-role="model-scroll">
      <p data-role="model-center"></p>
      <ul>
        <li data-role="model-scroll-hint"></li>
        <li data-role="model-click-hint"></li>
      </ul>
      <p class="tutorial-interaction-panel__extra" data-role="model-extra"></p>
    </div>
    <div class="tutorial-interaction-panel__actions">
      <button type="button" class="tutorial-panel-button" data-role="model-click"></button>
      <p class="tutorial-interaction-panel__status" role="status" data-role="model-status"></p>
      <button type="button" class="tutorial-panel-button tutorial-panel-button--secondary" data-role="model-continue" hidden></button>
    </div>`;
    isolatePanel(this.modelElement);
    this.modelObject = new CSS3DObject(this.modelElement);
    this.modelObject.visible = false;
    scene.add(this.modelObject);

    const modelClick = this.modelElement.querySelector<HTMLButtonElement>('[data-role="model-click"]')!;
    this.modelStatus = this.modelElement.querySelector<HTMLElement>('[data-role="model-status"]')!;
    this.modelContinue = this.modelElement.querySelector<HTMLButtonElement>('[data-role="model-continue"]')!;
    modelClick.addEventListener('click', () => {
      this.modelClicked = true;
      this.modelStatus.textContent = '';
      this.modelContinue.hidden = false;
      modelClick.disabled = true;
      this.modelStatus.textContent = this.modelElement.dataset.clickedCopy ?? '';
      this.callbacks.onModelClick();
    });
    this.modelContinue.addEventListener('click', () => this.callbacks.onModelContinue());

    this.guideElement.className = 'tutorial-interaction-panel tutorial-guide-panel';
    this.guideElement.setAttribute('aria-label', 'Guide interaction panel');
    this.guideElement.innerHTML = `<div class="tutorial-interaction-panel__header">
      <span class="tutorial-interaction-panel__eyebrow" data-role="guide-eyebrow"></span>
      <h2 data-role="guide-title"></h2>
    </div>
    <p class="tutorial-guide-panel__prompt" data-role="guide-prompt"></p>
    <div class="tutorial-guide-panel__log" role="log" aria-live="polite" data-role="guide-log"></div>
    <form class="tutorial-guide-panel__form">
      <label class="tutorial-sr-only" data-role="guide-label" for="tutorial-guide-message"></label>
      <input id="tutorial-guide-message" type="text" maxlength="300" autocomplete="off" data-role="guide-input">
      <button type="submit" class="tutorial-panel-button tutorial-panel-button--send" data-role="guide-send"></button>
    </form>
    <p class="tutorial-interaction-panel__status" role="status" data-role="guide-status"></p>
    <button type="button" class="tutorial-panel-button tutorial-panel-button--secondary" data-role="guide-continue" hidden></button>`;
    isolatePanel(this.guideElement);
    this.guideObject = new CSS3DObject(this.guideElement);
    this.guideObject.visible = false;
    scene.add(this.guideObject);

    this.guideLog = this.guideElement.querySelector<HTMLElement>('[data-role="guide-log"]')!;
    this.guideForm = this.guideElement.querySelector<HTMLFormElement>('form')!;
    this.guideInput = this.guideElement.querySelector<HTMLInputElement>('[data-role="guide-input"]')!;
    this.guideSend = this.guideElement.querySelector<HTMLButtonElement>('[data-role="guide-send"]')!;
    this.guideStatus = this.guideElement.querySelector<HTMLElement>('[data-role="guide-status"]')!;
    this.guideContinue = this.guideElement.querySelector<HTMLButtonElement>('[data-role="guide-continue"]')!;
    this.guideForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = this.guideInput.value.trim();
      if (!message || this.guideMessageSent) return;
      this.guideMessageSent = true;
      this.appendGuideMessage('user', message);
      this.appendGuideMessage('assistant', this.guideElement.dataset.responseCopy ?? '');
      this.guideInput.disabled = true;
      this.guideSend.disabled = true;
      this.guideContinue.hidden = false;
      this.guideStatus.textContent = '';
      this.guideInput.value = '';
      this.callbacks.onGuideMessage(message);
    });
    this.guideContinue.addEventListener('click', () => this.callbacks.onGuideContinue());
  }

  setCopy(copy: TutorialInteractionCopy): void {
    this.setText(this.modelElement, 'model-eyebrow', copy.model.panelEyebrow);
    this.setText(this.modelElement, 'model-title', copy.model.panelTitle);
    this.setText(this.modelElement, 'model-center', copy.model.center);
    this.setText(this.modelElement, 'model-scroll-hint', copy.model.scroll);
    this.setText(this.modelElement, 'model-click-hint', copy.model.click);
    this.setText(this.modelElement, 'model-extra', copy.model.extra);
    this.setText(this.modelElement, 'model-click', copy.model.clickButton);
    this.modelElement.dataset.clickedCopy = copy.model.clicked;
    this.setText(this.modelElement, 'model-continue', copy.model.continueButton);
    if (this.modelClicked) this.modelStatus.textContent = copy.model.clicked;
    this.modelElement.setAttribute('aria-label', copy.model.panelTitle);

    this.setText(this.guideElement, 'guide-eyebrow', copy.guide.panelEyebrow);
    this.setText(this.guideElement, 'guide-title', copy.guide.panelTitle);
    this.setText(this.guideElement, 'guide-prompt', copy.guide.prompt);
    this.setText(this.guideElement, 'guide-label', copy.guide.inputLabel);
    this.guideInput.placeholder = copy.guide.inputPlaceholder;
    this.guideSend.textContent = copy.guide.sendButton;
    this.guideElement.dataset.responseCopy = copy.guide.response;
    this.setText(this.guideElement, 'guide-continue', copy.guide.continueButton);
    this.guideElement.setAttribute('aria-label', copy.guide.panelTitle);
    if (this.guideMessageSent) {
      const response = this.guideLog.querySelector<HTMLElement>('[data-guide-role="assistant"]');
      if (response) response.textContent = copy.guide.response;
    }
  }

  setStep(step: TutorialInteractionStep): void {
    if (step === this.activeStep) return;
    this.activeStep = step;
    if (step === 'model') this.resetModel();
    if (step === 'guide') this.resetGuide();
    if (step !== 'model') this.hide(this.modelObject, this.modelElement);
    if (step !== 'guide') this.hide(this.guideObject, this.guideElement);
  }

  update(step: TutorialInteractionStep, player: THREE.Vector3, rocket: THREE.Vector3, guide: THREE.Vector3, camera: THREE.PerspectiveCamera): TutorialInteractionPresence {
    const modelNear = step === 'model' && player.distanceTo(rocket) <= modelActivationRadius;
    const guideNear = step === 'guide' && player.distanceTo(guide) <= guideActivationRadius;
    this.modelPanelAnchor.copy(rocket).z += 4;
    if (modelNear) this.show(this.modelObject, this.modelElement, this.modelPanelAnchor, camera, 4.8, modelPanelWidth, modelPanelHeight);
    else this.hide(this.modelObject, this.modelElement);
    if (guideNear) this.show(this.guideObject, this.guideElement, guide, camera, 4.1, guidePanelWidth, guidePanelHeight);
    else this.hide(this.guideObject, this.guideElement);
    return { modelNear, guideNear };
  }

  private resetModel(): void {
    this.modelClicked = false;
    const button = this.modelElement.querySelector<HTMLButtonElement>('[data-role="model-click"]')!;
    button.disabled = false;
    this.modelContinue.hidden = true;
    this.modelStatus.textContent = '';
  }

  private resetGuide(): void {
    this.guideMessageSent = false;
    this.guideLog.replaceChildren();
    this.guideInput.value = '';
    this.guideInput.disabled = false;
    this.guideSend.disabled = false;
    this.guideContinue.hidden = true;
    this.guideStatus.textContent = '';
  }

  private appendGuideMessage(role: 'user' | 'assistant', text: string): void {
    const message = document.createElement('p');
    message.className = `tutorial-guide-panel__message tutorial-guide-panel__message--${role}`;
    message.dataset.guideRole = role;
    message.textContent = text;
    this.guideLog.append(message);
    this.guideLog.scrollTop = this.guideLog.scrollHeight;
  }

  private setText(root: HTMLElement, role: string, text: string): void {
    root.querySelector<HTMLElement>(`[data-role="${role}"]`)!.textContent = text;
  }

  private show(object: CSS3DObject, element: HTMLElement, anchor: THREE.Vector3, camera: THREE.PerspectiveCamera, height: number, width: number, panelHeight: number): void {
    object.visible = true;
    element.style.visibility = 'visible';
    element.style.pointerEvents = 'auto';
    object.position.set(anchor.x, height, anchor.z);
    object.quaternion.copy(camera.quaternion);
    const distance = camera.position.distanceTo(object.position);
    const worldPerPixel = distance * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight;
    const desiredWidth = Math.min(width, Math.max(240, innerWidth - 28));
    object.scale.setScalar(Math.max(.001, desiredWidth * worldPerPixel / width));
    element.style.width = `${width}px`;
    element.style.height = `${panelHeight}px`;
  }

  private hide(object: CSS3DObject, element: HTMLElement): void {
    object.visible = false;
    element.style.visibility = 'hidden';
    element.style.pointerEvents = 'none';
  }
}
