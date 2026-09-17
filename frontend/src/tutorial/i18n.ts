import type { Language } from '../i18n';
import type { TutorialStepId } from './state';

export type FingerId = 'index' | 'middle' | 'ring' | 'thumb' | 'little';

export type TutorialStepCopy = {
  category: string;
  title: string;
  body: string;
  route: string;
  keyLabel: string;
};

export type TutorialCopy = {
  pageTitle: string;
  metaDescription: string;
  shellLabel: string;
  canvasLabel: string;
  brandLabel: string;
  brandName: string;
  brandCaption: string;
  headerEyebrow: string;
  headerTitle: string;
  progressLabel: string;
  stepLabel: string;
  promptTurn: string;
  promptDrag: string;
  focusLabel: string;
  routeHeading: string;
  cameraHint: string;
  touchMoveLabel: string;
  touchRunLabel: string;
  touchRunText: string;
  touchJumpLabel: string;
  fingerGuide: {
    eyebrow: string;
    title: string;
    diagramLabel: string;
    handAlt: string;
    in: string;
    fingers: Record<FingerId, { name: string; key: string; keyLabel: string }>;
  };
  complete: {
    eyebrow: string;
    title: string;
    body: string;
    enter: string;
  };
  feedback: {
    success: string;
    jumpSuccess: string;
    wrong: (keyLabel: string) => string;
    cameraComplete: string;
  };
  notices: {
    focused: (ball: string) => string;
    complete: string;
  };
  spheres: Record<'front' | 'behind' | 'left' | 'right', string>;
  webglError: {
    title: string;
    body: string;
    home: string;
  };
  steps: Record<TutorialStepId, TutorialStepCopy>;
};

const english: TutorialCopy = {
  pageTitle: 'Field guide · Learn the world',
  metaDescription: 'Learn how to explore the interactive portfolio world.',
  shellLabel: 'Interactive movement tutorial',
  canvasLabel: 'Tutorial room. Use the keyboard to move and drag to look around.',
  brandLabel: 'Return to the portfolio home',
  brandName: 'My world',
  brandCaption: 'A PERSONAL PORTFOLIO',
  headerEyebrow: 'FIELD GUIDE / TUTORIAL',
  headerTitle: 'Learn the controls',
  progressLabel: 'Tutorial progress',
  stepLabel: 'STEP',
  promptTurn: 'your turn',
  promptDrag: 'drag to look',
  focusLabel: 'spheres focused',
  routeHeading: 'YOUR ROUTE',
  cameraHint: 'drag the room to look around',
  touchMoveLabel: 'Drag to move',
  touchRunLabel: 'Hold to run',
  touchRunText: 'RUN',
  touchJumpLabel: 'Jump',
  fingerGuide: {
    eyebrow: 'KEYBOARD MAP',
    title: 'Place your hand here',
    diagramLabel: 'Keyboard layout with a transparent hand showing finger placement',
    handAlt: 'Semi-transparent left hand over the keys: index finger on D, middle finger on W, ring finger on A, thumb on Space, and little finger on Shift.',
    in: 'in',
    fingers: {
      index: { name: 'index finger', key: 'd', keyLabel: 'D' },
      middle: { name: 'middle finger', key: 'w', keyLabel: 'W' },
      ring: { name: 'ring finger', key: 'a', keyLabel: 'A' },
      thumb: { name: 'thumb', key: 'space', keyLabel: 'space' },
      little: { name: 'little finger', key: 'shift', keyLabel: 'shift' },
    },
  },
  complete: {
    eyebrow: 'FIELD GUIDE COMPLETE',
    title: 'You’re ready to wander.',
    body: 'You know the way around. The jump is just for fun, but the rest of the island is yours to discover.',
    enter: 'Enter the world',
  },
  feedback: {
    success: 'Nice. Keep going.',
    jumpSuccess: 'Lovely hop. That’s all jumping is for here.',
    wrong: keyLabel => `Try ${keyLabel} for this step.`,
    cameraComplete: 'All four are green. Camera lesson complete.',
  },
  notices: {
    focused: ball => `${ball} sphere focused.`,
    complete: 'Field guide complete. The island is waiting.',
  },
  spheres: { front: 'Front', behind: 'Behind', left: 'Left', right: 'Right' },
  webglError: {
    title: 'This field guide needs WebGL.',
    body: 'Try a browser with hardware acceleration enabled, then return to',
    home: 'the portfolio',
  },
  steps: {
    forward: { category: 'WALK', title: 'Press W to move forward', body: 'Hold the key until the panda takes a few steps. We’ll move on as soon as you do.', route: 'Forward', keyLabel: 'W' },
    backward: { category: 'WALK', title: 'Press S to move backwards', body: 'You can retrace your steps just as easily. Press the key and feel the room move with you.', route: 'Backwards', keyLabel: 'S' },
    left: { category: 'WALK', title: 'Press A to move left', body: 'Strafe around the spot. Keep your eyes on the sun while you try it.', route: 'Left', keyLabel: 'A' },
    right: { category: 'WALK', title: 'Press D to move right', body: 'One more side-step. The next lesson will teach you to turn the whole view.', route: 'Right', keyLabel: 'D' },
    camera: { category: 'LOOK', title: 'Drag to move the camera', body: 'Drag anywhere on the room to orbit the camera. Find the four red spheres — front, behind, and at both sides — and center each one.', route: 'Look around', keyLabel: 'DRAG' },
    run: { category: 'SPRINT', title: 'Hold Shift to run', body: 'Hold Shift while you move. Your little finger finds the key in the diagram, and the panda picks up the pace.', route: 'Run', keyLabel: 'shift' },
    jump: { category: 'PLAY', title: 'Press Space to jump', body: 'Press Space to hop. It serves no purpose here other than having fun jumping — go on, make the panda bounce.', route: 'Jump', keyLabel: 'space' },
  },
};

const spanish: TutorialCopy = {
  pageTitle: 'Guía · Aprende el mundo',
  metaDescription: 'Aprende a explorar el mundo interactivo del portafolio.',
  shellLabel: 'Tutorial interactivo de movimiento',
  canvasLabel: 'Sala del tutorial. Usa el teclado para moverte y arrastra para mirar alrededor.',
  brandLabel: 'Volver al inicio del portafolio',
  brandName: 'Mi mundo',
  brandCaption: 'UN PORTAFOLIO PERSONAL',
  headerEyebrow: 'GUÍA / TUTORIAL',
  headerTitle: 'Aprende los controles',
  progressLabel: 'Progreso del tutorial',
  stepLabel: 'PASO',
  promptTurn: 'te toca',
  promptDrag: 'arrastra para mirar',
  focusLabel: 'esferas enfocadas',
  routeHeading: 'TU RECORRIDO',
  cameraHint: 'arrastra la sala para mirar',
  touchMoveLabel: 'Arrastra para moverte',
  touchRunLabel: 'Mantén para correr',
  touchRunText: 'CORRER',
  touchJumpLabel: 'Saltar',
  fingerGuide: {
    eyebrow: 'MAPA DEL TECLADO',
    title: 'Coloca aquí la mano',
    diagramLabel: 'Distribución del teclado con una mano transparente que muestra la posición de los dedos',
    handAlt: 'Mano izquierda semitransparente sobre las teclas: dedo índice en D, dedo medio en W, dedo anular en A, pulgar en Espacio y meñique en Shift.',
    in: 'en',
    fingers: {
      index: { name: 'dedo índice', key: 'd', keyLabel: 'D' },
      middle: { name: 'dedo medio', key: 'w', keyLabel: 'W' },
      ring: { name: 'dedo anular', key: 'a', keyLabel: 'A' },
      thumb: { name: 'pulgar', key: 'space', keyLabel: 'espacio' },
      little: { name: 'meñique', key: 'shift', keyLabel: 'shift' },
    },
  },
  complete: {
    eyebrow: 'GUÍA COMPLETADA',
    title: 'Ya puedes explorar.',
    body: 'Ya sabes moverte por aquí. El salto solo sirve para divertirse, pero el resto de la isla está esperando que la descubras.',
    enter: 'Entrar al mundo',
  },
  feedback: {
    success: 'Bien. Continúa.',
    jumpSuccess: 'Buen salto. Para eso sirve saltar aquí.',
    wrong: keyLabel => `Prueba ${keyLabel} en este paso.`,
    cameraComplete: 'Las cuatro están verdes. Lección de cámara completada.',
  },
  notices: {
    focused: ball => `Esfera ${ball.toLocaleLowerCase()} enfocada.`,
    complete: 'Guía completada. La isla te espera.',
  },
  spheres: { front: 'delantera', behind: 'trasera', left: 'izquierda', right: 'derecha' },
  webglError: {
    title: 'Esta guía necesita WebGL.',
    body: 'Prueba un navegador con aceleración por hardware y vuelve',
    home: 'al portafolio',
  },
  steps: {
    forward: { category: 'CAMINAR', title: 'Pulsa W para avanzar', body: 'Mantén pulsada la tecla hasta que el panda dé unos pasos. Avanzaremos en cuanto lo hagas.', route: 'Avanzar', keyLabel: 'W' },
    backward: { category: 'CAMINAR', title: 'Pulsa S para retroceder', body: 'Puedes desandar el camino con la misma facilidad. Pulsa la tecla y siente cómo la sala se mueve contigo.', route: 'Retroceder', keyLabel: 'S' },
    left: { category: 'CAMINAR', title: 'Pulsa A para moverte a la izquierda', body: 'Muévete de lado alrededor del punto. Mantén la vista en el sol mientras lo pruebas.', route: 'Izquierda', keyLabel: 'A' },
    right: { category: 'CAMINAR', title: 'Pulsa D para moverte a la derecha', body: 'Un último paso lateral. La siguiente lección te enseñará a girar toda la vista.', route: 'Derecha', keyLabel: 'D' },
    camera: { category: 'MIRAR', title: 'Arrastra para mover la cámara', body: 'Arrastra por la sala para orbitar la cámara. Encuentra las cuatro esferas rojas — delante, detrás y a ambos lados — y centra cada una.', route: 'Mirar alrededor', keyLabel: 'ARRASTRA' },
    run: { category: 'CORRER', title: 'Mantén pulsado Shift para correr', body: 'Mantén pulsado Shift mientras te mueves. Tu meñique encuentra la tecla en el diagrama y el panda acelera.', route: 'Correr', keyLabel: 'shift' },
    jump: { category: 'JUGAR', title: 'Pulsa Espacio para saltar', body: 'Pulsa Espacio para dar un salto. Aquí no sirve para nada más que para divertirte saltando — haz que el panda rebote.', route: 'Saltar', keyLabel: 'espacio' },
  },
};

export const tutorialCopy: Record<Language, TutorialCopy> = { en: english, es: spanish };

export function getTutorialCopy(language: Language): TutorialCopy {
  return tutorialCopy[language];
}
