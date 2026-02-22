# PersonalPortfolio

Interactive 3D portfolio built with React, TypeScript, Vite, and Three.js.

The app renders a 3D scene with category models, card rings, and detail panels so visitors can explore work, projects, education, skills, and more.

## Highlights

- 3D portfolio scene powered by Three.js
- Category-driven information architecture loaded from local JSON files
- Runtime loading overlay with progress and mobile landscape recommendation
- In-scene selection + side panels for detailed content
- Asset credits panel and ambient music toggle
- Chatbot-friendly navigation bridge via `window.portfolioNavigateTo(...)`

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- ESLint

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm or Bun

### Install

```bash
npm install
```

or

```bash
bun install
```

### Run in development

```bash
npm run dev
```

The chatbot client also expects:

- `VITE_API_BASE_URL`

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

- `src/components/SpaceShowcase.tsx`: React host for the 3D scene, loading UI, panels, and toggles
- `src/features/space/runtime/SpaceSceneRuntime.ts`: scene runtime orchestration (camera, loading, model focus, events)
- `src/features/space/runtime/ModelRingManager.ts`: 3D model loading and ring placement
- `src/features/information/data/*.json`: portfolio content source files
- `src/features/information/index.ts`: typed category/profile assembly from JSON data
- `src/features/information/navigation.ts`: category/subcategory/item navigation resolution
- `src/App.css`: app styling and responsive behavior
- `docs/information-scene-architecture.md`: architecture and navigation notes

## Content Management

To update portfolio content:

1. Edit the JSON files in `src/features/information/data/`.
2. Keep item identifiers (`id`, `slug`) stable and unique.
3. Verify mapping/category behavior in `src/features/information/index.ts`.

## Programmatic Navigation

The app exposes this browser API for external navigation:

```ts
window.portfolioNavigateTo?.({ categoryId: 'work' });
window.portfolioNavigateTo?.({ categoryId: 'work', subcategoryId: 'companies' });
window.portfolioNavigateTo?.({
  categoryId: 'work',
  subcategoryId: 'companies',
  itemId: 'company-example',
});
```

For deeper details, see `docs/information-scene-architecture.md`.

## Notes

- 3D assets and audio are stored under `src/assets/`.
