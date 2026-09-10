/** UI translations stay separate from canonical world IDs and visitor conversations. */
export const languages = ['en', 'es'] as const;
export type Language = typeof languages[number];
const spanish: Record<string, string> = {
  'Run':'Correr','Hold to run':'Mantén pulsado para correr','A wider view':'Una vista más amplia',
  'Turn your phone sideways for more room to explore.':'Gira tu teléfono para tener más espacio para explorar.',
  'Continue in portrait':'Continuar en vertical',
  'to jump. Drag the world to look around. On touchscreens, use the thumbstick, hold Run, and tap Jump.':'para saltar. Arrastra el mundo para mirar. En pantallas táctiles, usa el joystick, mantén Correr y pulsa Saltar.',
  'Interactive island portfolio':'Portafolio de una isla interactiva',
  'A little world home':'Inicio de un pequeño mundo', 'a little world':'un pequeño mundo',
  'A PERSONAL PORTFOLIO':'UN PORTAFOLIO PERSONAL', 'A GOOD DAY TO EXPLORE':'UN BUEN DÍA PARA EXPLORAR',
  'Unmute audio':'Activar sonido','Mute audio':'Silenciar sonido','Show controls':'Ver controles',
  'Play background music':'Activar música de fondo','Pause background music':'Pausar música de fondo',
  'Music could not play. Try enabling it again.':'No se pudo reproducir la música. Intenta activarla de nuevo.',
  'Language':'Idioma','WELCOME TO MY CORNER OF THE WORLD':'BIENVENIDO A MI RINCÓN DEL MUNDO',
  'Big ideas.':'Grandes ideas.','A little island.':'Una pequeña isla.',
  'Follow your curiosity. Every path':'Sigue tu curiosidad. Cada camino','has a story to tell.':'tiene una historia que contar.',
  'Let’s wander':'Vamos a explorar','7 places to discover':'7 lugares por descubrir','Make yourself at home':'Siéntete como en casa',
  'YOU ARE EXPLORING':'ESTÁS EXPLORANDO','The greenway':'El sendero verde',
  'A friend for the journey':'Un amigo para el viaje','Walk up to your guide to say hello.':'Acércate a tu guía para saludar.',
  'ISLAND MAP':'MAPA DE LA ISLA','Island map':'Mapa de la isla','You are here':'Estás aquí','Take the scenic route ↗':'Disfruta del camino ↗',
  'Guide destinations':'Destinos del guía','WHERE TO?':'¿ADÓNDE VAMOS?','Close destinations':'Cerrar destinos','Your guide will lead the way.':'Tu guía te mostrará el camino.',
  'Move':'Moverse','Drag to look':'Arrastra para mirar','Take a little run':'Corre un poco','Jump':'Saltar','Drag to move':'Arrastra para moverte','Drag the world to look around':'Arrastra el mundo para mirar alrededor',
  'Close controls':'Cerrar controles','A FIELD GUIDE':'GUÍA DE EXPLORACIÓN','A world at your pace.':'Un mundo a tu ritmo.',
  'Walk with':'Camina con','or the arrow keys. Hold':'o las flechas. Mantén','to run. Press':'para correr. Pulsa','to jump. Drag the world to look around. On touchscreens, use the thumbstick and jump button.':'para saltar. Arrastra el mundo para mirar. En pantallas táctiles, usa el joystick y el botón de salto.',
  'Approach a landmark to open its notebook. Walk behind it to discover the other side. You can type, select text, and scroll inside each notebook.':'Acércate a un lugar para abrir su cuaderno. Camina detrás para descubrir el otro lado. Puedes escribir, seleccionar texto y desplazarte dentro de cada cuaderno.',
  'Your companion waits nearby. Walk up to chat, or choose a place on the island map for a guided walk.':'Tu compañero espera cerca. Acércate para conversar o elige un lugar en el mapa para dar un paseo guiado.',
  'Got it. Let’s explore ↗':'Entendido. Vamos a explorar ↗',
  '3D island. Use WASD to walk and drag to rotate the camera.':'Isla 3D. Usa WASD para caminar, Espacio para saltar y arrastra para girar la cámara.',
  'This little world needs WebGL.':'Este pequeño mundo necesita WebGL.',
  'Try a browser with hardware acceleration enabled. You can still browse the island’s destinations from the map.':'Prueba un navegador con aceleración por hardware. También puedes consultar los destinos en el mapa.',
  'The graphics connection was interrupted. Reload to return to the island.':'Se interrumpió la conexión gráfica. Recarga para volver a la isla.',
  'Follow your guide to {title}.':'Sigue a tu guía hasta {title}.',
  'Projects':'Proyectos','PERSONAL PROJECTS':'PROYECTOS PERSONALES',
  'Work experience':'Experiencia laboral','WORK & LEADERSHIP':'TRABAJO Y LIDERAZGO',
  'Skills & education':'Habilidades y educación','SKILLS & LEARNING':'HABILIDADES Y APRENDIZAJE',
  'About me':'Sobre mí','PROFILE & CURIOSITY':'PERFIL Y CURIOSIDAD',
  'Honors & awards':'Honores y premios','ACHIEVEMENTS':'LOGROS',
  'Hobbies':'Pasatiempos','LIFE BEYOND CODE':'VIDA MÁS ALLÁ DEL CÓDIGO',
  'Library of Pergamon':'Biblioteca de Pérgamo','EMPIRE CONSTRUCTION IN PROGRESS':'IMPERIO EN CONSTRUCCIÓN',
  'Beyond the horizon':'Más allá del horizonte','SPACE & AMBITION':'ESPACIO Y AMBICIÓN',
  'Born to explore':'Nacido para explorar','AVIATION & CURIOSITY':'AVIACIÓN Y CURIOSIDAD',
  'Connecting the dots':'Conectando las ideas','AI & ENGINEERING':'IA E INGENIERÍA',
  'What matters most':'Lo que más importa','FAMILY & LOVE':'FAMILIA Y AMOR',
  'Still standing':'Aún en pie','RESILIENCE & GROWTH':'RESILIENCIA Y CRECIMIENTO',
  'A little stronger':'Un poco más fuerte','DISCIPLINE & TRAINING':'DISCIPLINA Y ENTRENAMIENTO',
  'Forever a student':'Siempre aprendiendo','THE LIBRARY · UNDER CONSTRUCTION':'LA BIBLIOTECA · EN CONSTRUCCIÓN',
  'Companion conversation':'Conversación con tu compañero','Your island guide':'Tu guía de la isla','A little company, a little curiosity.':'Un poco de compañía y curiosidad.',
  'Conversation history':'Historial de conversación','Message your guide':'Escribe a tu guía','Where shall we go?':'¿Adónde vamos?','Send message':'Enviar mensaje',
  'LOCAL DEMO GUIDE':'GUÍA LOCAL DE DEMOSTRACIÓN','Clear history':'Borrar historial','YOUR GUIDE':'TU GUÍA',
  'Let me finish this thought first.':'Déjame terminar esta idea primero.','Thinking…':'Pensando…',
  'Welcome, wanderer. Ask me about a landmark, or choose a destination on the island map.':'Bienvenido, viajero. Pregúntame por un lugar o elige un destino en el mapa de la isla.',
  'I could not find a clear route. Try meeting me on the path.':'No encontré una ruta despejada. Intenta reunirte conmigo en el sendero.',
  'The guide is unavailable. Please try again.':'El guía no está disponible. Inténtalo de nuevo.',
  'The guide received an invalid reply.':'El guía recibió una respuesta no válida.',
  'The guide received an unknown destination or invalid message.':'El guía recibió un destino desconocido o un mensaje no válido.','Request cancelled.':'Solicitud cancelada.',
  'This embedded page is not available.':'Esta página integrada no está disponible.','Opening the notebook…':'Abriendo el cuaderno…',
  'This notebook could not be opened. Approach again or reload to retry.':'No se pudo abrir el cuaderno. Acércate de nuevo o recarga para reintentarlo.',
  'front':'frente','back':'reverso','THE OTHER SIDE':'EL OTRO LADO','A little secret':'Un pequeño secreto',
  'You walked around {title}. Curiosity looks good on you.':'Rodeaste {title}. La curiosidad te queda bien.',
  'This corner is reserved for future stories, hidden notes, and the occasional terrible joke.':'Este rincón está reservado para futuras historias, notas ocultas y algún chiste terrible.',
  'ISLAND NOTEBOOK':'CUADERNO DE LA ISLA','This is a place for a personal story. Projects, photographs, reflections, and links will live here as the portfolio grows.':'Este es un lugar para una historia personal. Aquí habrá proyectos, fotografías, reflexiones y enlaces a medida que crezca el portafolio.',
  'About this space':'Sobre este espacio','The island is a work in progress. This sample content is supplied by the local panel service and can later be managed independently of the world.':'La isla está en construcción. Este contenido de ejemplo proviene del servicio local de paneles y después podrá gestionarse independientemente del mundo.',
  'A note to yourself':'Una nota para ti','Try typing here…':'Prueba a escribir aquí…','Your note stays in this panel for this visit.':'Tu nota permanece en este panel durante esta visita.',
  "Let's head to {title}. Follow me along the paths! {subtitle} Take a look behind the landmark, too—there is another side to every story.":'Vamos a {title}. ¡Sígueme por los senderos! {subtitle} Mira también detrás del lugar: cada historia tiene otro lado.',
  "Welcome to my little island! I'm a local demo guide for now. Ask me to take you to {places}. You can also wander at your own pace and discover the stories at each landmark.":'¡Bienvenido a mi pequeña isla! Por ahora soy un guía local de demostración. Pídeme que te lleve a {places}. También puedes explorar a tu ritmo y descubrir las historias de cada lugar.',
};
const storageKey = 'portfolio.language.v1';
export function resolveLanguage(preferences: readonly string[]): Language {
  for (const preference of preferences) {
    const base = preference.toLowerCase().split(/[-_]/)[0];
    if (languages.includes(base as Language)) return base as Language;
  }
  return 'en';
}
function initialLanguage(): Language {
  try { const saved = localStorage.getItem(storageKey); if (languages.includes(saved as Language)) return saved as Language; } catch { /* Storage is optional. */ }
  return resolveLanguage(typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]);
}
let language = initialLanguage();
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export function setLanguage(next: Language): void {
  if (!languages.includes(next)) return;
  language = next;
  try { localStorage.setItem(storageKey, next); } catch { /* Private-mode storage is optional. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  listeners.forEach(listener => listener());
}
export function onLanguageChange(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function t(source: string, values: Record<string, string> = {}): string {
  if (source.startsWith('⌘')) return `⌘  ${t('ISLAND MAP')}`;
  const secret = /^You walked around (.+)\. Curiosity looks good on you\.$/.exec(source);
  if (secret) return t('You walked around {title}. Curiosity looks good on you.', {title:t(secret[1])});
  const surface = /^(.+) (front|back)$/.exec(source);
  if (surface) return `${t(surface[1])} ${t(surface[2])}`;
  return (language === 'es' ? spanish[source] ?? source : source).replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
/** Translate static UI in place, preserving inputs, focus, open details and scroll. Never visit conversation messages. */
export function localize(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest('[data-i18n-skip],script,style,option')) continue;
    const source = originalText.get(node) ?? node.textContent ?? '';
    originalText.set(node, source);
    const trimmed = source.trim();
    node.textContent = source.replace(trimmed, t(trimmed));
  }
  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.closest('[data-i18n-skip]')) continue;
    const originals = originalAttributes.get(element) ?? new Map<string, string>();
    for (const attribute of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;
      const source = originals.get(attribute) ?? value; originals.set(attribute, source);
      element.setAttribute(attribute, t(source));
    }
    originalAttributes.set(element, originals);
  }
}
