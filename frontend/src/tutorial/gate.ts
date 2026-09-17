import './gate.css';

const gate = document.querySelector<HTMLElement>('#tutorial-gate');
const start = document.querySelector<HTMLAnchorElement>('#tutorial-gate-start');
const skip = document.querySelector<HTMLButtonElement>('#tutorial-gate-skip');
const choiceKey = 'portfolio.tutorial.v1.choice';

if (gate && start && skip) {
  const choice = window.localStorage.getItem(choiceKey);
  const tutorialUrl = new URL('tutorial/', document.baseURI).toString();
  start.href = tutorialUrl;

  if (choice === 'skipped' || choice === 'complete') {
    gate.remove();
  } else {
    gate.hidden = false;
    window.requestAnimationFrame(() => start.focus({ preventScroll: true }));
  }

  skip.addEventListener('click', () => {
    window.localStorage.setItem(choiceKey, 'skipped');
    gate.hidden = true;
    gate.remove();
  });
}
