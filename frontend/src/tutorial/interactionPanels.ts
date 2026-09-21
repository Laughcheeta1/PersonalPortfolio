import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { config } from '../config';
import { isolatePanel, panelScaleForViewport, renderContent, type PanelContentRenderer } from '../panels';
import type { TutorialPanelGuideCopy } from '../panel-content';
import type { TutorialInteractionCopy } from './i18n';

export type TutorialInteractionStep = 'model' | 'guide' | null;

export interface TutorialInteractionCallbacks {
  onModelClick: () => void;
  onModelContinue: () => void;
  onGuideMessage: (message: string) => void;
}

export interface TutorialInteractionPresence {
  modelNear: boolean;
  guideNear: boolean;
}

const modelActivationRadius = 8;
const guideActivationRadius = 3.8;

export class TutorialInteractionPanels {
  private readonly modelElement = document.createElement('article');
  private readonly guideElement = document.createElement('section');
  private readonly modelObject: CSS3DObject;
  private readonly guideObject: CSS3DObject;
  private readonly modelContentRenderer: PanelContentRenderer;
  private readonly guideLog: HTMLElement;
  private readonly guideForm: HTMLFormElement;
  private readonly guideInput: HTMLInputElement;
  private readonly guideSend: HTMLButtonElement;
  private readonly guideStatus: HTMLElement;
  private readonly callbacks: TutorialInteractionCallbacks;
  private activeStep: TutorialInteractionStep = null;
  private modelGuideCopy: TutorialPanelGuideCopy | undefined;
  private modelResetKey = 0;
  private modelProgress = 0;
  private guideMessageSent = false;

  constructor(scene: THREE.Scene, callbacks: TutorialInteractionCallbacks) {
    this.callbacks = callbacks;

    this.modelElement.className = 'world-panel tutorial-model-panel';
    this.modelElement.setAttribute('aria-label', 'Rocket interaction panel');
    this.modelElement.style.width = `${config.panels.width}px`;
    this.modelElement.style.height = `${config.panels.height}px`;
    isolatePanel(this.modelElement);
    this.modelContentRenderer = renderContent(this.modelElement, 'starship:front');
    this.modelObject = new CSS3DObject(this.modelElement);
    this.modelObject.rotation.y = 0;
    this.modelObject.position.z = .02;
    this.hide(this.modelObject, this.modelElement);
    scene.add(this.modelObject);

    this.guideElement.className = 'chat-anchor';
    this.guideElement.setAttribute('aria-label', 'Companion conversation');
    this.guideElement.style.setProperty('--chat-open-duration', `${config.panels.openDuration}s`);
    isolatePanel(this.guideElement);
    this.guideElement.innerHTML = `<div class="chat-full">
      <header><span class="guide-avatar">✦</span><div><strong>Island guide</strong></div><span class="online-dot"></span><button type="button" class="clear-chat">Clear history</button></header>
      <div class="chat-log" role="log" aria-label="Conversation history"></div>
      <p class="chat-status" role="status"></p>
      <form><input aria-label="Message your guide" placeholder="Where shall we go?" maxlength="300" autocomplete="off"><button aria-label="Send message" type="submit">↑</button></form>
    </div><div class="comic"><strong>YOUR GUIDE</strong><p></p></div>`;
    this.guideObject = new CSS3DObject(this.guideElement);
    this.hide(this.guideObject, this.guideElement);
    scene.add(this.guideObject);

    this.guideLog = this.guideElement.querySelector<HTMLElement>('.chat-log')!;
    this.guideForm = this.guideElement.querySelector<HTMLFormElement>('form')!;
    this.guideInput = this.guideElement.querySelector<HTMLInputElement>('input')!;
    this.guideSend = this.guideElement.querySelector<HTMLButtonElement>('form button')!;
    this.guideStatus = this.guideElement.querySelector<HTMLElement>('.chat-status')!;
    this.guideElement.querySelector<HTMLButtonElement>('.clear-chat')!.addEventListener('click', () => this.resetGuide());
    this.guideForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = this.guideInput.value.trim();
      if (!message || this.guideMessageSent) return;
      this.guideMessageSent = true;
      this.appendGuideMessage('user', message);
      this.appendGuideMessage('assistant', this.guideElement.dataset.responseCopy ?? '');
      this.guideInput.disabled = true;
      this.guideSend.disabled = true;
      this.guideStatus.textContent = '';
      this.guideInput.value = '';
      this.callbacks.onGuideMessage(message);
    });
  }

  setCopy(copy: TutorialInteractionCopy): void {
    this.modelGuideCopy = {
      ...copy.model,
      resetKey: this.modelResetKey,
      onClick: () => this.callbacks.onModelClick(),
      onContinue: () => this.callbacks.onModelContinue(),
    };
    this.modelContentRenderer(this.modelGuideCopy);
    this.modelElement.setAttribute('aria-label', copy.model.panelTitle);

    this.guideElement.setAttribute('aria-label', copy.guide.panelTitle);
    this.guideInput.setAttribute('aria-label', copy.guide.inputLabel);
    this.guideInput.placeholder = copy.guide.inputPlaceholder;
    this.guideSend.setAttribute('aria-label', copy.guide.sendButton);
    this.guideElement.dataset.responseCopy = copy.guide.response;
    this.guideElement.dataset.promptCopy = copy.guide.prompt;
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
    if (step !== 'model') {
      this.modelProgress = 0;
      this.hide(this.modelObject, this.modelElement);
    }
    if (step !== 'guide') this.hide(this.guideObject, this.guideElement);
  }

  update(step: TutorialInteractionStep, player: THREE.Vector3, rocket: THREE.Vector3, guide: THREE.Vector3, camera: THREE.PerspectiveCamera, dt: number): TutorialInteractionPresence {
    const modelNear = step === 'model' && player.distanceTo(rocket) <= modelActivationRadius;
    const guideNear = step === 'guide' && player.distanceTo(guide) <= guideActivationRadius;
    this.updateModel(step === 'model' && modelNear, rocket, camera, dt);
    this.updateGuide(guideNear, guide, camera);
    return { modelNear, guideNear };
  }

  private updateModel(open: boolean, rocket: THREE.Vector3, camera: THREE.PerspectiveCamera, dt: number): void {
    this.modelProgress = THREE.MathUtils.clamp(this.modelProgress + (open ? dt / config.panels.openDuration : -dt / config.panels.closeDuration), 0, 1);
    const p = config.animation.reducedMotion ? Number(open) : this.modelProgress;
    const eased = open ? 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2 : p * p;
    const panelPosition = new THREE.Vector3(rocket.x, config.panels.verticalOffset - config.panels.rise * (1 - eased), rocket.z + .02);
    const toward = camera.position.clone().sub(panelPosition);
    const front = toward.dot(new THREE.Vector3(0, 0, 1)) > 0;
    const visible = p > 0 && front;
    this.modelObject.position.copy(panelPosition);
    this.modelObject.rotation.y = 0;
    this.modelObject.scale.setScalar(panelScaleForViewport(camera.position.distanceTo(panelPosition), camera.fov, innerWidth, innerHeight) * Math.max(.001, eased));
    this.modelObject.updateMatrixWorld(true);
    this.modelObject.visible = visible;
    this.modelElement.style.visibility = visible ? 'visible' : 'hidden';
    this.modelElement.style.pointerEvents = visible && p > .8 ? 'auto' : 'none';
    this.modelElement.inert = !visible;
    this.modelElement.style.opacity = String(Math.min(1, p * 3));
    this.modelElement.dataset.state = open ? (p >= 1 ? 'active' : 'opening') : (p <= 0 ? 'inactive' : 'closing');
  }

  private updateGuide(open: boolean, guide: THREE.Vector3, camera: THREE.PerspectiveCamera): void {
    this.guideObject.position.copy(guide).add(new THREE.Vector3(0, config.ui.chatHeight, 0));
    this.guideObject.quaternion.copy(camera.quaternion);
    const distance = camera.position.distanceTo(this.guideObject.position);
    const worldPerPixel = distance * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight;
    const desiredWidth = Math.min(config.ui.chatWidth, innerWidth - config.ui.viewportPadding * 2);
    const elementWidth = innerWidth < 600 ? config.ui.mobileChatWidth : config.ui.chatWidth;
    this.guideObject.scale.setScalar(desiredWidth * worldPerPixel / elementWidth);
    const projected = this.guideObject.position.clone().project(camera);
    const screenX = (projected.x + 1) * innerWidth / 2;
    const clampedX = THREE.MathUtils.clamp(screenX, desiredWidth / 2 + config.ui.viewportPadding, innerWidth - desiredWidth / 2 - config.ui.viewportPadding);
    this.guideObject.position.add(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar((clampedX - screenX) * worldPerPixel));
    this.setVisibility(this.guideObject, this.guideElement, open);
  }

  private resetModel(): void {
    this.modelResetKey += 1;
    this.modelProgress = 0;
    if (this.modelGuideCopy) {
      this.modelGuideCopy = { ...this.modelGuideCopy, resetKey: this.modelResetKey };
      this.modelContentRenderer(this.modelGuideCopy);
    }
  }

  private resetGuide(): void {
    this.guideMessageSent = false;
    this.guideLog.replaceChildren();
    this.appendGuideMessage('assistant', this.guideElement.dataset.promptCopy ?? '');
    this.guideInput.value = '';
    this.guideInput.disabled = false;
    this.guideSend.disabled = false;
    this.guideStatus.textContent = '';
  }

  private appendGuideMessage(role: 'user' | 'assistant', text: string): void {
    const message = document.createElement('p');
    message.className = `message ${role}`;
    message.dataset.guideRole = role;
    message.textContent = text;
    this.guideLog.append(message);
    this.guideLog.scrollTop = this.guideLog.scrollHeight;
  }

  private setVisibility(object: CSS3DObject, element: HTMLElement, visible: boolean): void {
    object.visible = visible;
    element.style.visibility = visible ? 'visible' : 'hidden';
    element.style.pointerEvents = visible ? 'auto' : 'none';
    element.inert = !visible;
  }

  private hide(object: CSS3DObject, element: HTMLElement): void {
    this.setVisibility(object, element, false);
  }
}
