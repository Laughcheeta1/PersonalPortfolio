import './orientation.css';

export type OrientationCopy = {
  label: string;
  title: string;
  body: string;
  continueLabel: string;
};

type OrientationTip = {
  element: HTMLElement;
  setCopy: (copy: OrientationCopy) => void;
  update: () => void;
  dispose: () => void;
};

const isSmallTouchViewport = () => matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 640;

export function createOrientationTip(host: HTMLElement, copy: OrientationCopy, id: string): OrientationTip {
  const element = document.createElement('aside');
  element.id = id;
  element.className = 'orientation-tip';
  element.setAttribute('role', 'note');

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '↻';
  const content = document.createElement('div');
  const title = document.createElement('strong');
  const body = document.createElement('p');
  const continueButton = document.createElement('button');
  continueButton.type = 'button';
  content.append(title, body, continueButton);
  element.append(icon, content);
  host.append(element);

  let dismissed = false;
  const setCopy = (nextCopy: OrientationCopy) => {
    element.setAttribute('aria-label', nextCopy.label);
    title.textContent = nextCopy.title;
    body.textContent = nextCopy.body;
    continueButton.textContent = nextCopy.continueLabel;
    continueButton.setAttribute('aria-label', nextCopy.continueLabel);
  };
  const update = () => {
    element.hidden = dismissed || !isSmallTouchViewport() || innerWidth >= innerHeight;
  };
  const refresh = () => {
    update();
    window.setTimeout(update, 0);
  };
  const onViewportChange = () => refresh();

  setCopy(copy);
  continueButton.addEventListener('click', () => {
    dismissed = true;
    update();
  });
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
  window.visualViewport?.addEventListener('resize', onViewportChange);
  update();

  return {
    element,
    setCopy,
    update,
    dispose: () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
    },
  };
}

export function isSmallViewport(): boolean {
  return Math.min(innerWidth, innerHeight) <= 640;
}
