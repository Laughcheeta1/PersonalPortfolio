import { getLanguage, languages, onLanguageChange, setLanguage, t, type Language } from './index';

const languageNames: Record<Language, string> = { en: 'English', es: 'Español' };

/** A DOM menu keeps the language choices styled consistently on desktop and touch. */
export function createLanguageMenu(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'language-menu';
  root.dataset.i18nSkip = '';
  const trigger = document.createElement('button');
  trigger.id = 'language';
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-controls', 'language-options');
  trigger.setAttribute('aria-expanded', 'false');
  const selectedName = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'language-chevron';
  chevron.textContent = '⌄';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(selectedName, chevron);

  const menu = document.createElement('div');
  menu.id = 'language-options';
  menu.className = 'language-options';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  const options = languages.map(language => {
    const option = document.createElement('button');
    option.type = 'button';
    option.tabIndex = -1;
    option.setAttribute('role', 'menuitemradio');
    option.lang = language;
    option.dataset.language = language;
    const name = document.createElement('span');
    name.textContent = languageNames[language];
    const check = document.createElement('span');
    check.className = 'language-check';
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    option.append(name, check);
    option.addEventListener('click', () => { setLanguage(language); close(true); });
    menu.append(option);
    return option;
  });
  const refresh = () => {
    const selected = getLanguage();
    selectedName.textContent = languageNames[selected];
    trigger.setAttribute('aria-label', `${t('Language')}: ${languageNames[selected]}`);
    menu.setAttribute('aria-label', t('Language'));
    options.forEach((option, index) => option.setAttribute('aria-checked', String(languages[index] === selected)));
  };
  function close(restoreFocus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }
  function open(index = languages.indexOf(getLanguage())) {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    options[index].focus();
  }
  trigger.addEventListener('click', () => menu.hidden ? open() : close(true));
  root.addEventListener('keydown', event => {
    // These keys belong to the menu, not the world movement/camera controls.
    event.stopPropagation();
    if (event.key === 'Tab') { close(true); return; }
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (menu.hidden) { open(event.key === 'End' || event.key === 'ArrowUp' ? options.length - 1 : 0); return; }
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[index].focus();
  });
  root.addEventListener('focusout', event => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', event => {
    if (event.target instanceof Node && !root.contains(event.target)) close();
  });
  root.append(trigger, menu);
  refresh();
  onLanguageChange(refresh);
  return root;
}
