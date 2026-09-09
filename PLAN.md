# Portfolio execution plan

## Current update

- [x] Add configurable grounded jumps and faster running, preserving collisions and panel input.
- [x] Use the supplied voice sample; add optional music and louder biome sound layers.
- [x] Add browser-default English/Spanish localization and minimap hover/focus titles.
- [x] Fix held movement being cleared by camera-drag focus and restrict landmark titles to path-based nearby radii.
- [x] Add mobile jump/run controls, a dismissible portrait-to-landscape recommendation, and safe-area landscape layout.
- [x] Document all settings and how to edit spatial HTML panel content.
- [x] Verify behavioral tests, asset bundling, and relevant browser interactions.

Update verification: 79 unit tests pass. Desktop browser checks cover jumping/landing, held movement during camera drags, locale default/persistence, minimap hover/focus, nearby labels, and music/global mute. Full Chrome mobile checks pass portrait recommendation/dismissal, touch jump, run control visibility and landscape layout. The cached headless shell stalled when injecting touch; the installed full Chrome completed the same mobile checks. Both supplied MP3s are emitted by the production build; originals remain at their supplied paths.

- [x] Establish typed configuration, canonical landmarks and navigation.
- [x] Create original procedural landmarks, characters and reference-inspired island.
- [x] Implement collision-aware player/camera, biome blending and spatial DOM panels.
- [x] Implement companion guidance, mock services, speech queue and persistence.
- [x] Verify production build, behavioural tests and browser interaction.

Existing deleted application files are pre-existing user changes. No third-party models or backend implementation will be introduced.

Verification: 69 behavioral tests pass, including all seven complete guided journeys. Chromium checks pass desktop movement, guided commands, mobile viewport/joystick presence, DOM panel typing, selection enablement, wheel scrolling, pointer isolation, and opposite-facing back content. Original asset sheet rendered and inspected; bouquet front wrapping corrected following visual review. Software-rendered frame counts are recorded in browser output, not presented as real hardware FPS measurements. See frontend/README.md for the procedural art scope and remaining fidelity limits.
