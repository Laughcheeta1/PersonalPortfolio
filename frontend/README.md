# A little world

This README is also the owner’s settings guide. Start with [editing panel content](#edit-the-displayed-3d-html-panels), [gameplay settings](#gameplay-settings-reference), [audio](#audio-settings-and-your-mp3-files), or [languages](#language-settings).

Original Three.js island portfolio with a FastAPI portfolio/chat backend. No third-party 3D models. The visitor is a 3D panda monk; the human companion follows `references/me.png` and wears a left-arm WHOOP band.

## Run

From the repository root, install the workspace dependencies and start the
full stack with Nx:

```sh
pnpm install
make run
```

`make run` copies `frontend/.env` from `.env.example` when missing, then
starts Vite on `http://127.0.0.1:5173` and FastAPI on
`http://127.0.0.1:8000`. Nx streams prefixed `frontend:` and `backend:`
logs to the terminal (the Terminal UI is disabled so serve output is not
held until the process exits). Run an individual service with
`pnpm exec nx run frontend:serve` or `pnpm exec nx run backend:serve`.

`pnpm exec nx run frontend:build` checks TypeScript and creates `dist/`.
`pnpm exec nx run frontend:test` runs the behavioral suite. The pnpm workspace
explicitly declines esbuild's optional lifecycle script; the platform binary
is installed as a dependency.

The backend lives in [`../backend`](../backend/README.md). Run it separately with `uv sync` and `uv run uvicorn app.main:app --reload --port 8000` from that directory. Start Ollama with `ollama serve` and pull the configured model with `ollama pull llama3.2`. Set `VITE_API_BASE_URL` to change the default `http://127.0.0.1:8000/api` endpoint.

## Edit and tune

- `src/config.ts`: player/camera controls, following and chat radii, navigation, panel and speech timing (seconds), audio, rendering budgets.
- `src/world/registry.ts`: the only stable landmark ID definitions, transforms, content keys, collision footprints, and biome profiles. Front surfaces face their approach paths; backs face away.
- `src/world/environmentConfig.ts`: seeded environmental generation and visual budgets.
- `src/world/models.ts`: original parametric asset geometry. Static landmarks are merged by material; mesh proportions are authored asset details, not gameplay settings.
- `src/world/navigation.ts`: the road graph and collision-free route entry. Rendering uses this same graph. Dijkstra follows explicit road and entrance nodes; local visibility routes avoid obstacle circles.
- `src/services/index.ts`: replace `ChatService`, `PanelContentService`, or `HistoryStore` implementations without changing the world renderer. The backend adapters use the FastAPI service and retain local implementations as offline/test fallbacks.

## Panels and input

Three.js CSS3DRenderer anchors real DOM nodes in the scene. Landmark panels never billboard. Only their camera-facing front or back receives events, with explicit selection enabled. The world listens for camera gestures on its WebGL element, so panel clicks, selections, wheel events, forms, and inputs remain browser interactions. Mobile panels retain readable dimensions instead of uniformly shrinking the desktop layout.

HTML is sanitized with DOMPurify at the rendering boundary. Embedded pages require HTTPS and receive a sandbox without same-origin access, top navigation, or popup privileges. Scripts/forms/presentation are allowed inside the isolated frame. Do not add `allow-same-origin` casually when integrating future content. CSS3D surfaces are an overlay renderer and do not participate in WebGL depth testing; proximity and explicit front/back visibility manage their presentation.

## Companion and audio

Guided travel takes priority over following, and follows actual roads to an entrance. After arrival the companion waits for both the configured hold and speech completion, then resumes normal behavior. Following starts outside the follow radius and stops at the target radius. Long catch-up trips use the road graph to bound route-search work.

Complete mock responses enter a display queue (`received → displaying → finished → idle`). Punctuation pauses are separate from character timing. Leaving chat range replaces the full history UI with a three-line scrolling speech bubble. Received conversation history is stored locally independently of visual speech completion, so subsequent service calls see full conversational context; inaccessible or invalid storage does not break the scene. Speech uses your MP3 sample; ambience is synthesized locally. All audio starts muted and requires a user gesture. The sound button controls speech, ambience and the optional soundtrack.

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

The backend is stateless and does not persist conversations; the browser keeps local conversation history. Deployment configuration is intentionally left to the host environment.

## Edit the displayed 3D HTML panels

The “canvases” are real interactive HTML panels. Edit [`src/content/panels.ts`](src/content/panels.ts), keeping its existing imports and type declaration. Replace the empty `panelContent` object with your own front/back definitions. Omitted entries or sides keep the localized demo content.

| Landmark | Content key |
| --- | --- |
| Starship | `rocket` |
| F-22 | `jet` |
| Neural network | `network` |
| Roses | `bouquet` |
| Victory statue | `statue` |
| Squat rack | `gym` |
| Pergamon library | `library` |

Example replacement:

```ts
export const panelContent: Partial<Record<Landmark['model'], {
  front?: PanelDefinition;
  back?: PanelDefinition;
}>> = {
  rocket: {
    front: {
      type: 'html',
      html: `
        <p class="eyebrow">MY PROJECTS</p>
        <h2>Things I have built</h2>
        <p>Replace this with your introduction.</p>
        <a href="https://example.com">Visit my project</a>
        <details><summary>Read more</summary><p>A longer story.</p></details>
      `,
    },
    back: {
      type: 'html',
      html: '<h2>You found the secret!</h2><p>Your hidden message.</p>',
    },
  },
};
```

Use `{ type: 'none' }` to hide a side, including its frame. Custom override HTML is shared across languages and preserved on language changes. The built-in demo content is translated. For language-specific custom definitions, extend the content service to select by locale and reload only that panel’s definition when the language changes.

For a video or entire page, use an iframe definition instead:

```ts
front: {
  type: 'iframe',
  url: 'https://www.youtube-nocookie.com/embed/YOUR_VIDEO_ID',
  title: 'My project demonstration',
}
```

Use the video’s embed URL, not a watch URL. Other HTTPS webpages work only if their host permits embedding (CSP or `X-Frame-Options` may block it). Sandbox permissions are controlled in `src/panels.ts`; do not add same-origin privileges casually.

HTML is sanitized: scripts, inline event handlers, inline styles and raw nested iframes are removed. Put reusable styling in `.world-panel` CSS classes in `src/style.css`. Normal buttons, links, inputs, selection and scrolling work. A form alone does not save or send data: add an explicit destination or event handler for that functionality. There is no contact-form backend yet.

Save while `pnpm dev` runs to see content edits. Refresh after changing gameplay, generated geometry or audio settings so existing objects/buffers are rebuilt. Production updates require `pnpm build` and deployment of the new `dist/`.

## Gameplay settings reference

Settings below live in [`src/config.ts`](src/config.ts). Distances are world units, angles are radians unless specified, and durations are seconds except `ui.noticeDuration` (milliseconds).

Desktop: WASD/arrows move, Shift runs, Space jumps, drag looks. Mobile: joystick moves, drag looks, Jump jumps, hold Run to sprint. Portrait phones get a dismissible landscape recommendation; landscape is recommended, never forced. Safe-area and landscape layouts live in `src/style.css`.

| Group | Settings and effects |
| --- | --- |
| `player` | `walkSpeed` / `runSpeed`: maximum speeds (5 / 10; running previously 8). `acceleration` / `deceleration`: velocity smoothing rates, larger is more responsive. `rotationSpeed`: turning response. `radius`: horizontal collider. `spawn`: starting `[x,z]` outside obstacles. |
| `player` jumps | `jumpSpeed`: takeoff speed (8.5). `gravity`: downward acceleration (22). `jumpBuffer`: how long a press just before landing is remembered (0.12). |
| `camera` | `distance`: orbit distance. `height`: target above feet. `pitch`: initial angle. `minPitch` / `maxPitch`: vertical limits. `mouseSensitivity` / `touchSensitivity`: radians per dragged pixel. `smoothing`: follow response. `fov`: vertical field of view in **degrees**. `near` / `far`: clipping planes. |
| `companion` | `followRadius`: start following beyond this distance. `targetRadius`: stop following at this distance; keep below followRadius. `chatRadius`: independent full-chat distance. `speed` / `roadSpeed`: following / guided speeds. `acceleration`, `deceleration`, `rotationSpeed`: response rates. `arrivalRadius`: waypoint tolerance. `guidedHold`: minimum destination wait, also waits for speech. `repathInterval`: normal-follow route recalculation interval. |
| `input` | `joystickRadius`: maximum thumb displacement in CSS pixels. Keep the joystick’s CSS size consistent. |

Jump height is approximately `jumpSpeed² / (2 × gravity)`; airtime is `2 × jumpSpeed / gravity` (currently 1.64 units and 0.77 seconds). You can move in the air and jump again on landing. This does not add double jumps, platform climbing or jumping through structure/shoreline colliders. Camera dragging preserves held movement keys; editable panel focus and loss of browser focus release world input.

## Panel and nearby title-card settings

| Group | Settings and effects |
| --- | --- |
| `panels` | `activationRadius`: default opening distance, copied to registry `proximityRadius`. `deactivationRadius`: closing distance; keep larger than activation to prevent flicker. `openDuration` / `closeDuration`: animation times. `verticalOffset`: final center height. `rise`: distance raised during opening. `scale`: desktop DOM-to-world multiplier. `width` / `height`: desktop frame dimensions in CSS pixels. Mobile uses adaptive sizing. |
| `ui` titles | `labelRadiusMultiplier`: multiplies the landmark-to-main-road path distance to define its title-card circle. Default 1; use 0.5 to halve it. `labelScale` / `labelHeight`: small title-card size / height. This radius does not change full panels or minimap tooltips. |
| `ui` chat | `chatHeight` / `speechHeight`: full-chat / comic bubble anchor height. `chatWidth` / `mobileChatWidth`: DOM width targets. `viewportPadding`: screen-edge clearance. `chatScale`: fallback scale for non-perspective cameras. |
| `ui` other | `mobileBreakpoint`: threshold used for responsive world/prompt behavior. `noticeDuration`: temporary notice duration in milliseconds. CSS breakpoints, fonts, button sizes, safe-area spacing and landscape layouts are in `src/style.css`. |

Minimap markers show a title popup on hover or keyboard focus. The small world title cards appear only near their own landmarks; the full portfolio panels still use their separate hysteresis radii.

## Audio settings and your MP3 files

The supplied files remain at `assets/sound_effects/sans_voice.mp3` and `assets/music/the_smoke_decides.mp3`. Replace them at the same path to change the voice or music. If renaming, update the `new URL(...)` in `src/chat/Speech.ts` or `src/chat/MusicPlayer.ts`. Vite bundles hashed URLs in production. Voice loads and decodes once after a gesture; music loads on demand.

Music and ambience are enabled by default and begin after the first user interaction, as required by browser autoplay rules. The single music-note button mutes/unmutes every audio source; a slash means muted. Music playback failures appear in a notice and playback retries on a later interaction.

| Group | Settings and effects |
| --- | --- |
| `speech` timing | `characterDelay`, `spaceDelay`, `commaDelay`, `periodDelay`, `lineBreakDelay`: display cadence and natural pauses. `holdDuration`: final distant bubble hold. |
| `speech` sound | `volume`: voice gain (0.18). `sampleOffset`: start inside the MP3 (0.22 seconds skips this file’s initial silence; revisit when replacing it). `sampleDuration`: snippet length (0.075 seconds). `playbackRate`: speed/pitch multiplier. `playbackRateVariance`: randomized variation. `minSoundInterval`: minimum interval between snippets. |
| `audio` | `ambientVolume`: base surf/wind gain (0.065, previously 0.012). `biomeVolume`: overall biome-layer gain (0.10). `musicVolume`: soundtrack volume (0.25, valid 0–1). `bufferSeconds`: synthesized loop duration. `baseFilter`, `lunarFilter`, `altitudeFilter`: surf low-pass cutoff targets in Hz. `blendTime`: smooth gain/filter transition time constant. |

[`src/chat/audioConfig.ts`](src/chat/audioConfig.ts) defines `ambientSynthesis.profiles` for **all seven biomes**. Each profile has `filter` (cutoff Hz), `noise` (noise strength), `frequency` (tone Hz), `tone` (tone strength), `pulse` (cycles/second), and `modulation` (pulse depth, usually 0–1). Increase an individual profile’s `noise` or `tone` to emphasize only that biome. `noiseInput`, `noiseMemory`, `noiseGain` tune the shared noise generator; `lunarSurfAttenuation` controls how much ordinary surf fades around Starship. Profile gains blend by world proximity.

## Language settings

[`src/i18n/index.ts`](src/i18n/index.ts) supports English and Spanish. With no saved choice, it checks `navigator.languages` in order, matches regional locales such as `es-CO` / `en-US`, and falls back to English if no supported language matches. A manual selection persists under `portfolio.language.v1` and takes precedence. Remove that browser-storage key to return to automatic browser-language selection.

English source strings are fallback dictionary keys; `spanish` maps them to translations. Keep interpolation tokens such as `{title}` unchanged. `t()` translates generated strings, and `localize()` updates static DOM in place. Visitor messages, received conversations and authored panel HTML are preserved on language changes. New demo guide responses use the selected language.

To add a language, extend `languages` and the lookup/dictionaries in `t()`, then add its native label in `src/i18n/LanguageMenu.ts`. The custom dropdown uses the island palette and supports keyboard navigation. Extend `src/i18n/i18n.test.ts`. Custom panel localization is a separate content-service concern, described above.

The human companion’s blonde hair colors are `palette.companionHair` and `palette.companionHairHighlights` in `src/world/models.ts`. These do not affect the panda visitor avatar.

## Landmarks, paths, and the world boundary

Edit [`src/world/registry.ts`](src/world/registry.ts): `id` is the stable backend contract, `model` selects a builder/content key, `title`/`subtitle` are visible text, `position` is `[x,z]`, `biome` selects its profile, and `color` colors its minimap marker. Do not rename stable IDs merely to change labels; translate/change the visible title instead.

`rotation` (Y radians), `scale`, `frontPanel`/`backPanel` content keys, `navigationNode`, `proximityRadius`, and `collisionRadius` are currently derived in the mapping after the registry array. Edit that mapping for individual rules. Scale and collision footprint must stay aligned. Model shapes, local proportions and materials are in `src/world/models.ts`.

| Group | Settings and effects |
| --- | --- |
| `world` | `centerX`, `radiusX`, `radiusZ`: elliptical island geometry/bounds. `shoreline`: safe inset. `roadWidth` / `pathWidth`: main and branch widths. `groundHeight`: jump landing height; terrain/models are presently authored at y=0, so moving the ground also requires adjusting their placement. |
| `navigation` | `roadStart` / `roadEnd`: road x endpoints. `curveFrequency` / `curveAmplitude`: curve shape. `entranceOffset`: minimum landmark approach offset. `entranceClearance`: padding beyond landmark collider. `avoidanceSamples`: candidates around obstacles. `avoidancePadding`: extra route clearance. `obstacleSearchMargin`: local search corridor width; larger searches cost more CPU. `sampleStep` is reserved: road samples currently remain one unit apart in `navigation.ts`. |

Keep landmark x coordinates on the sampled road and between its endpoints. Adding a landmark also requires a valid model builder, content/translations, and clear approach geometry. Run the navigation tests after changing layout, colliders, road widths or generation seed. The library’s long western journey is intentional.

## Biomes, lighting, sky, and animation

The `biomes` object in the registry defines `innerRadius` (full influence), `outerRadius` (zero influence), `strength` (blend weight), `sky`/`ground`/`light` colors, `fog` density, and `ambient` hemisphere intensity. Keep outer larger than inner. Pergamon’s outer radius is intentionally much larger. The older `particles` / `audio` fields are **reserved metadata with no current rendering effect**: use the particle budgets and actual audio profiles documented here.

| Group | Settings and effects |
| --- | --- |
| `atmosphere` | `smoothing`: transition response. `sky`, `fog`, `ambient`, `sun`, `sunColor`: baseline colors/intensities. `exposure`: tone mapping brightness. `environmentIntensity`: reflected environment lighting. |
| `sky` | `clouds` / `stars`: counts. `cloudRadius`, `cloudHeight`, `starRadius`: placement dimensions. `cloudDrift`: cloud motion. Stars appear toward the lunar biome. |
| `animation` | `walkFrequency` / `walkAmplitude`: limb swing. `waterSpeed` / `waterAmplitude`: waves. `speechFrequency`: mouth movement. `reducedMotion`: defaults to browser preference and suppresses decorative animation without disabling jumping. `bobAmplitude` is currently reserved and has no effect. |

## Environment generation and performance settings

All fields in [`src/world/environmentConfig.ts`](src/world/environmentConfig.ts):

| Settings | Effect |
| --- | --- |
| `seed`, `placementAttempts` | Deterministic layout and attempt limit. A new seed moves props/colliders. |
| `terrainSegments`, `terrainRings`, `cliffDepth` | Terrain resolution and cliff depth. |
| `grass`, `sand`, `cliff`, `ocean`, `road` | Baseline colors, with spatial biome blending over grass. |
| `routeClearance`, `landmarkClearance`, `treeSightClearance` | Keep decoration away from routes, structures and sight lines. |
| `treeEdgeMargin`, `treeScaleMin`, `treeScaleVariation`, `leavesPerTree` | Tree placement, size range and foliage density. |
| `rocks`, `shoreRocks`, `shrubs`, `grassCount`, `flowerPetals` | Prop counts and petals per flower. |
| `lampSpacing`, `lampRadius` | Lamp spacing and collision size. |
| `curbSpacing`, `fenceSpacing`, `fenceLength` | Roadside layout. |
| `classicalStart` | X threshold for western classical scenery. |
| `particleHeight`, `particleSpeed`, `particleSize` | Particle placement, movement and size. |
| `particleBobAmplitude`, `particleRotationSpeed`, `waveCount` | Particle motion and ocean stroke count. |

Under `config.performance`, `maxDpr`/`mobileDpr` cap rendering pixel density; `shadowMap` is shadow texture size; `maxDelta` bounds simulated time per frame; `trees`/`flowers`/`particles` set generation counts. `lodDistance` is legacy/reserved now that title visibility has a separate path-based radius. Instancing and material batching are the active mesh optimizations. GPU budgets are not real-device FPS guarantees; profile intended devices.

## Conversation persistence and backend

`BrowserHistoryStore` in `src/services/index.ts` accepts a storage key and maximum message count (defaults: `portfolio.conversation.v1`, 100). Clear history through the chat UI. Full replies are persisted on receipt independently of visual speech completion. To change mock responses, edit `createChatService()`.

The default `ChatService` and `PanelContentService` adapters call the FastAPI backend at `VITE_API_BASE_URL` (default `http://127.0.0.1:8000/api`). If the backend is unavailable, the existing local implementations keep the island usable for demos and browser checks. Validate backend destination IDs and sanitize external HTML. Backend replies are complete responses, not streams. Provider configuration and Ollama setup live in [`../backend/README.md`](../backend/README.md).

`window.portfolioDebug` exposes read-only player position/grounded state, guide behavior, speech state, language, music/mute state and render counts for troubleshooting. Browser scripts need the local server and an installed Chromium; use `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to select one.
