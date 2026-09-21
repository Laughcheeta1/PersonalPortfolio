import type { Language } from '../i18n';
import type { OrientationCopy } from '../orientation';
import type { TutorialStepId } from './state';

export type TutorialInteractionCopy = {
  model: {
    panelEyebrow: string;
    panelTitle: string;
    center: string;
    scroll: string;
    click: string;
    extra: string;
    clickButton: string;
    clicked: string;
    continueButton: string;
  };
  guide: {
    panelEyebrow: string;
    panelTitle: string;
    prompt: string;
    inputLabel: string;
    inputPlaceholder: string;
    sendButton: string;
    response: string;
  };
};

export type TutorialStepCopy = {
  category: string;
  title: string;
  body: string;
  route: string;
  keyLabel: string;
  touchTitle: string;
  touchBody: string;
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
  touchControlsHint: string;
  orientation: OrientationCopy;
  handPlacement: {
    eyebrow: string;
    title: string;
    body: string;
    keyboardLabel: string;
    keyboardInstructions: Array<{ instruction: string; key: string }>;
    mouseLabel: string;
    mouseInstructions: string;
    imageAlt: string;
    ok: string;
    showButton: string;
  };
  interactions: TutorialInteractionCopy;
  complete: {
    eyebrow: string;
    title: string;
    body: string;
    enter: string;
  };
  feedback: {
    success: string;
    jumpSuccess: string;
    guideSuccess: string;
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
  touchControlsHint: 'On a phone? Use the thumbstick to move, hold Run to sprint, tap Jump to hop, and drag the world to look around.',
  orientation: {
    label: 'A wider view',
    title: 'Rotate for a wider view',
    body: 'Turn your phone sideways to make the field guide easier to follow.',
    continueLabel: 'Continue in portrait',
  },
  handPlacement: {
    eyebrow: 'BEFORE YOU START',
    title: 'Place your hands',
    body: 'Use your left hand on the keyboard and your right hand on the mouse.',
    keyboardLabel: 'Left hand · keyboard',
    keyboardInstructions: [
      { instruction: 'Pinky on', key: 'Shift' },
      { instruction: 'Ring finger on', key: 'A' },
      { instruction: 'Middle finger on', key: 'W' },
      { instruction: 'Index finger on', key: 'D' },
      { instruction: 'Thumb on', key: 'Space' },
    ],
    mouseLabel: 'Right hand · mouse',
    mouseInstructions: 'Keep your right hand on the mouse to look around the world.',
    imageAlt: 'Top-down view of the correct left-hand keyboard placement and right-hand mouse placement.',
    ok: 'OK',
    showButton: 'Press here to show hand placement',
  },
  interactions: {
    model: {
      panelEyebrow: 'FIELD GUIDE · PANEL',
      panelTitle: 'You found a 3D model.',
      center: 'Move the camera to center the panel.',
      scroll: 'You can scroll on the panel.',
      click: 'You can click things on the panel.',
      extra: 'The world keeps useful information inside panels attached to its models. Try moving the camera, scrolling through this panel, and using the button below.',
      clickButton: 'Click to test the panel',
      clicked: 'Nice — that click worked.',
      continueButton: 'Continue to your guide',
    },
    guide: {
      panelEyebrow: 'GUIDE CHARACTER',
      panelTitle: 'Send your guide a message',
      prompt: 'Type anything and press Send. This practice reply stays inside the tutorial.',
      inputLabel: 'Message your guide',
      inputPlaceholder: 'Say hello',
      sendButton: 'Send',
      response: 'You sent a message! In the actual world you will get a response from an AI',
    },
  },
  complete: {
    eyebrow: 'FIELD GUIDE COMPLETE',
    title: 'You’re ready to wander.',
    body: 'You know the controls, how to open a model panel, and how to start a conversation with your guide.',
    enter: 'Enter the world',
  },
  feedback: {
    success: 'Nice. Keep going.',
    jumpSuccess: 'Lovely hop. That’s all jumping is for here.',
    guideSuccess: 'Message sent. The field guide is complete.',
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
    forward: { category: 'WALK', title: 'Press W to move forward', body: 'Hold the key until the panda takes a few steps. We’ll move on as soon as you do.', touchTitle: 'Drag the thumbstick forward', touchBody: 'Use the on-screen thumbstick to move the panda forward. We’ll move on as soon as you do.', route: 'Forward', keyLabel: 'W' },
    backward: { category: 'WALK', title: 'Press S to move backwards', body: 'You can retrace your steps just as easily. Press the key and feel the room move with you.', touchTitle: 'Drag the thumbstick back', touchBody: 'Use the on-screen thumbstick to move the panda back. We’ll move on as soon as you do.', route: 'Backwards', keyLabel: 'S' },
    left: { category: 'WALK', title: 'Press A to move left', body: 'Strafe around the spot. Keep the panda centered while you try it.', touchTitle: 'Drag the thumbstick left', touchBody: 'Use the on-screen thumbstick to move the panda left. Keep the panda centered while you try it.', route: 'Left', keyLabel: 'A' },
    right: { category: 'WALK', title: 'Press D to move right', body: 'One more side-step. The next lesson will teach you to turn the whole view.', touchTitle: 'Drag the thumbstick right', touchBody: 'Use the on-screen thumbstick to move the panda right. One more side-step, then we’ll turn the view.', route: 'Right', keyLabel: 'D' },
    camera: { category: 'LOOK', title: 'Drag to move the camera', body: 'Drag anywhere on the room to orbit the camera. Find the four red spheres — front, behind, and at both sides — and center each one.', touchTitle: 'Drag to look around', touchBody: 'Drag across the room to look around. Find the four red spheres — front, behind, and at both sides — and center each one.', route: 'Look around', keyLabel: 'DRAG' },
    run: { category: 'SPRINT', title: 'Hold Shift to run', body: 'Hold Shift while you move. Your little finger finds the key in the diagram, and the panda picks up the pace.', touchTitle: 'Hold Run to sprint', touchBody: 'Hold Run while you move. The panda will pick up the pace.', route: 'Run', keyLabel: 'shift' },
    jump: { category: 'PLAY', title: 'Press Space to jump', body: 'Press Space to hop. It serves no purpose here other than having fun jumping — go on, make the panda bounce.', touchTitle: 'Tap Jump to hop', touchBody: 'Tap Jump to make the panda bounce. It is just for fun here.', route: 'Jump', keyLabel: 'space' },
    model: { category: 'INTERACT', title: 'Open a 3D model panel', body: 'Walk up to the rocket. When you are close enough, its panel will pop up and teach you how to interact with information in the world.', touchTitle: 'Walk up to the rocket', touchBody: 'Use the thumbstick to get close to the rocket. Its panel will pop up when you are near.', route: 'Open a model panel', keyLabel: '' },
    guide: { category: 'CHAT', title: 'Send a message to your guide', body: 'Walk up to the guide character. When the chat panel opens, type a message and send it.', touchTitle: 'Message your guide', touchBody: 'Use the thumbstick to get close to the guide, then type and send a message.', route: 'Talk to your guide', keyLabel: '' },
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
  touchControlsHint: '¿Estás en un teléfono? Usa el joystick para moverte, mantén Correr para acelerar, pulsa Saltar y arrastra el mundo para mirar.',
  orientation: {
    label: 'Una vista más amplia',
    title: 'Gira el teléfono para ver mejor',
    body: 'Pon el teléfono en horizontal para seguir la guía con más comodidad.',
    continueLabel: 'Continuar en vertical',
  },
  handPlacement: {
    eyebrow: 'ANTES DE EMPEZAR',
    title: 'Coloca las manos',
    body: 'Usa la mano izquierda en el teclado y la mano derecha en el ratón.',
    keyboardLabel: 'Mano izquierda · teclado',
    keyboardInstructions: [
      { instruction: 'Meñique en', key: 'Shift' },
      { instruction: 'Anular en', key: 'A' },
      { instruction: 'Medio en', key: 'W' },
      { instruction: 'Índice en', key: 'D' },
      { instruction: 'Pulgar en', key: 'Espacio' },
    ],
    mouseLabel: 'Mano derecha · ratón',
    mouseInstructions: 'Mantén la mano derecha en el ratón para mirar alrededor del mundo.',
    imageAlt: 'Vista superior de la posición correcta de la mano izquierda en el teclado y de la mano derecha en el ratón.',
    ok: 'OK',
    showButton: 'Pulsa aquí para mostrar la posición de las manos',
  },
  interactions: {
    model: {
      panelEyebrow: 'GUÍA · PANEL',
      panelTitle: 'Has encontrado un modelo 3D.',
      center: 'Mueve la cámara para centrar el panel.',
      scroll: 'Puedes desplazarte por el panel.',
      click: 'Puedes hacer clic en los elementos del panel.',
      extra: 'El mundo guarda información útil en paneles unidos a sus modelos. Mueve la cámara, desplázate por este panel y usa el botón de abajo.',
      clickButton: 'Haz clic para probar el panel',
      clicked: 'Bien — el clic funcionó.',
      continueButton: 'Continuar con tu guía',
    },
    guide: {
      panelEyebrow: 'PERSONAJE GUÍA',
      panelTitle: 'Envía un mensaje a tu guía',
      prompt: 'Escribe cualquier cosa y pulsa Enviar. Esta respuesta de práctica solo aparece en el tutorial.',
      inputLabel: 'Mensaje para tu guía',
      inputPlaceholder: 'Di hola',
      sendButton: 'Enviar',
      response: '¡Has enviado un mensaje! En el mundo real recibirás una respuesta de una IA',
    },
  },
  complete: {
    eyebrow: 'GUÍA COMPLETADA',
    title: 'Ya puedes explorar.',
    body: 'Ya sabes usar los controles, abrir un panel de modelo y empezar una conversación con tu guía.',
    enter: 'Entrar al mundo',
  },
  feedback: {
    success: 'Bien. Continúa.',
    jumpSuccess: 'Buen salto. Para eso sirve saltar aquí.',
    guideSuccess: 'Mensaje enviado. La guía está completada.',
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
    forward: { category: 'CAMINAR', title: 'Pulsa W para avanzar', body: 'Mantén pulsada la tecla hasta que el panda dé unos pasos. Avanzaremos en cuanto lo hagas.', touchTitle: 'Arrastra el joystick hacia delante', touchBody: 'Usa el joystick de la pantalla para mover el panda hacia delante. Avanzaremos en cuanto lo hagas.', route: 'Avanzar', keyLabel: 'W' },
    backward: { category: 'CAMINAR', title: 'Pulsa S para retroceder', body: 'Puedes desandar el camino con la misma facilidad. Pulsa la tecla y siente cómo la sala se mueve contigo.', touchTitle: 'Arrastra el joystick hacia atrás', touchBody: 'Usa el joystick de la pantalla para mover el panda hacia atrás. Avanzaremos en cuanto lo hagas.', route: 'Retroceder', keyLabel: 'S' },
    left: { category: 'CAMINAR', title: 'Pulsa A para moverte a la izquierda', body: 'Muévete de lado alrededor del punto. Mantén el panda centrado mientras lo pruebas.', touchTitle: 'Arrastra el joystick a la izquierda', touchBody: 'Usa el joystick de la pantalla para mover el panda a la izquierda. Mantén el panda centrado mientras lo pruebas.', route: 'Izquierda', keyLabel: 'A' },
    right: { category: 'CAMINAR', title: 'Pulsa D para moverte a la derecha', body: 'Un último paso lateral. La siguiente lección te enseñará a girar toda la vista.', touchTitle: 'Arrastra el joystick a la derecha', touchBody: 'Usa el joystick de la pantalla para mover el panda a la derecha. Después giraremos la vista.', route: 'Derecha', keyLabel: 'D' },
    camera: { category: 'MIRAR', title: 'Arrastra para mover la cámara', body: 'Arrastra por la sala para orbitar la cámara. Encuentra las cuatro esferas rojas — delante, detrás y a ambos lados — y centra cada una.', touchTitle: 'Arrastra para mirar alrededor', touchBody: 'Arrastra por la sala para mirar alrededor. Encuentra las cuatro esferas rojas — delante, detrás y a ambos lados — y centra cada una.', route: 'Mirar alrededor', keyLabel: 'ARRASTRA' },
    run: { category: 'CORRER', title: 'Mantén pulsado Shift para correr', body: 'Mantén pulsado Shift mientras te mueves. Tu meñique encuentra la tecla en el diagrama y el panda acelera.', touchTitle: 'Mantén Correr para acelerar', touchBody: 'Mantén pulsado Correr mientras te mueves. El panda acelerará.', route: 'Correr', keyLabel: 'shift' },
    jump: { category: 'JUGAR', title: 'Pulsa Espacio para saltar', body: 'Pulsa Espacio para dar un salto. Aquí no sirve para nada más que para divertirte saltando — haz que el panda rebote.', touchTitle: 'Pulsa Saltar para brincar', touchBody: 'Pulsa Saltar para hacer que el panda rebote. Aquí es solo por diversión.', route: 'Saltar', keyLabel: 'espacio' },
    model: { category: 'INTERACTUAR', title: 'Abre el panel de un modelo 3D', body: 'Acércate al cohete. Cuando estés suficientemente cerca, su panel aparecerá y te enseñará a interactuar con la información del mundo.', touchTitle: 'Acércate al cohete', touchBody: 'Usa el joystick para acercarte al cohete. Su panel aparecerá cuando estés cerca.', route: 'Abrir un panel', keyLabel: '' },
    guide: { category: 'CHAT', title: 'Envía un mensaje a tu guía', body: 'Acércate al personaje guía. Cuando se abra el panel de chat, escribe un mensaje y envíalo.', touchTitle: 'Escribe a tu guía', touchBody: 'Usa el joystick para acercarte a la guía y después escribe y envía un mensaje.', route: 'Hablar con tu guía', keyLabel: '' },
  },
};

export const tutorialCopy: Record<Language, TutorialCopy> = { en: english, es: spanish };

export function getTutorialCopy(language: Language): TutorialCopy {
  return tutorialCopy[language];
}
