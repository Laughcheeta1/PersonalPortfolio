# A little world

Frontend-only, original Three.js island portfolio. No third-party 3D models or backend requests. The visitor is a 3D panda monk; the human companion follows `references/me.png` and wears a left-arm WHOOP band.

## Run

```sh
cd frontend
pnpm install
pnpm dev
```

`pnpm build` checks TypeScript and creates `dist/`. `pnpm test` runs the behavioral suite. The pnpm workspace explicitly declines esbuild's optional lifecycle script; the platform binary is installed as a dependency.

## Edit and tune

- `src/config.ts`: player/camera controls, following and chat radii, navigation, panel and speech timing (seconds), audio, rendering budgets.
- `src/world/registry.ts`: the only stable landmark ID definitions, transforms, content keys, collision footprints, and biome profiles. Front surfaces face their approach paths; backs face away.
- `src/world/environmentConfig.ts`: seeded environmental generation and visual budgets.
- `src/world/models.ts`: original parametric asset geometry. Static landmarks are merged by material; mesh proportions are authored asset details, not gameplay settings.
- `src/world/navigation.ts`: the road graph and collision-free route entry. Rendering uses this same graph. Dijkstra follows explicit road and entrance nodes; local visibility routes avoid obstacle circles.
- `src/services/index.ts`: replace `ChatService`, `PanelContentService`, or `HistoryStore` implementations without changing the world renderer. Current portfolio copy is explicitly placeholder content; the chat is a deterministic local guide, not an LLM.

## Panels and input

Three.js CSS3DRenderer anchors real DOM nodes in the scene. Landmark panels never billboard. Only their camera-facing front or back receives events, with explicit selection enabled. The world listens for camera gestures on its WebGL element, so panel clicks, selections, wheel events, forms, and inputs remain browser interactions. Mobile panels retain readable dimensions instead of uniformly shrinking the desktop layout.

HTML is sanitized with DOMPurify at the rendering boundary. Embedded pages require HTTPS and receive a sandbox without same-origin access, top navigation, or popup privileges. Scripts/forms/presentation are allowed inside the isolated frame. Do not add `allow-same-origin` casually when integrating future content. CSS3D surfaces are an overlay renderer and do not participate in WebGL depth testing; proximity and explicit front/back visibility manage their presentation.

## Companion and audio

Guided travel takes priority over following, and follows actual roads to an entrance. After arrival the companion waits for both the configured hold and speech completion, then resumes normal behavior. Following starts outside the follow radius and stops at the target radius. Long catch-up trips use the road graph to bound route-search work.

Complete mock responses enter a display queue (`received → displaying → finished → idle`). Punctuation pauses are separate from character timing. Leaving chat range replaces the full history UI with a three-line scrolling speech bubble. Received conversation history is stored locally independently of visual speech completion, so subsequent service calls see full conversational context; inaccessible or invalid storage does not break the scene. Audio is synthesized locally, starts muted, and requires a user gesture. The sound button controls both speech and ambient wind/surf.

## Verification and visual review

`pnpm test` covers service validation, persistence, speech queue timing, panel hysteresis, biome continuity, island collisions, every road edge against generated obstacles, and complete guided journeys to all seven locations.

With the dev server running and a Playwright Chromium installation available:

```sh
node scripts/browser-check.mjs
node scripts/model-review.mjs
node scripts/panels-check.mjs
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to reuse an existing Chromium binary. Browser checks exercise movement, guide commands and mobile layout. They write review images to `/tmp/portfolio-*.png`. The static model sheet exposes each original asset for comparison with the reference artwork. `window.portfolioDebug` provides read-only positions, behavior, panel/speech state, triangle and draw-call counts for profiling.

## Scope and remaining art limits

This is a working procedural interpretation, not a pixel-identical reconstruction of the supplied illustration references. The geometry now includes curled rose petals, folded paper, statue drapery and fractures, rocket tower bracing, aircraft camouflage, gym plate markings, and library terraces/scaffolding/cranes. The environment has a level playable surface with decorative coastal cliffs and mountains; it does not reproduce the references' full network of raised terraces and waterfalls. Further sculptural refinement and device-specific GPU profiling remain appropriate before presenting it as final production art.

The backend, genuine portfolio content, LLM answers, permanent server persistence, and deployment are intentionally not implemented. The build is a static site and needs no Cloud Run service yet.
