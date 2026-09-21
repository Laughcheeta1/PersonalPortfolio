import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await page.route('http://127.0.0.1:53173/', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body></body></html>',
  }));
  await page.goto('http://127.0.0.1:53173/');

  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { TutorialInteractionPanels } = await import('/src/tutorial/interactionPanels.ts');
    const { getTutorialCopy } = await import('/src/tutorial/i18n.ts');
    const scene = new THREE.Scene();
    let callbackSawResponse = false;
    const panels = new TutorialInteractionPanels(scene, {
      onModelClick: () => {},
      onModelContinue: () => {},
      onGuideMessage: () => {
        const guideElement = scene.children.find(object => object.element?.classList.contains('chat-anchor'))?.element;
        callbackSawResponse = Boolean(guideElement?.querySelector('[data-guide-role="assistant"]')?.textContent);
      },
    });
    panels.setCopy(getTutorialCopy('en').interactions);
    await new Promise(resolve => setTimeout(resolve, 50));

    const modelElement = scene.children.find(object => object.element?.classList.contains('world-panel'))?.element;
    const guideElement = scene.children.find(object => object.element?.classList.contains('chat-anchor'))?.element;
    const input = guideElement?.querySelector('input');
    if (!modelElement || !guideElement || !input) throw new Error('Tutorial interaction panels did not mount.');
    input.value = 'Hello';
    guideElement.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    return {
      projectUniverses: modelElement.querySelectorAll('.project-universe').length,
      tutorialGuide: modelElement.querySelectorAll('.tutorial-panel-guide').length,
      response: guideElement.querySelector('[data-guide-role="assistant"]')?.textContent ?? '',
      callbackSawResponse,
    };
  });

  assert.equal(result.projectUniverses, 0);
  assert.equal(result.tutorialGuide, 1);
  assert.match(result.response, /You sent a message/);
  assert.equal(result.callbackSawResponse, true);
  console.log('PASS: tutorial rocket panel is tutorial-only and guide completion fires after the automatic reply is mounted.');
} finally {
  await browser.close();
}
