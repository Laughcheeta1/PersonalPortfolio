# Information Scene Architecture

This document explains how the 3D information system works, how data is structured, and how navigation is performed.

## 1. Goal

The scene uses 6 3D models as top-level categories. When a category/model is focused, circular rows of card boxes appear behind the model. Each row represents a subcategory, and each card represents an item.

Clicking a card opens full information in the UI panel.

## 2. Main Files

- `src/features/information/models.ts`
  - Core domain types (profile, categories, scene item types, navigation target).
- `src/features/information/data/*.json`
  - Hardcoded content split by category.
- `src/features/information/index.ts`
  - Builds a typed `professionalProfile` and `sceneInformationCategories`.
- `src/features/information/navigation.ts`
  - Validates and resolves navigation commands.
- `src/features/space/SpaceSceneRuntime.ts`
  - Three.js runtime (camera, model focus, card creation/layout, click handling).
- `src/components/SpaceShowcase.tsx`
  - React host, panel state, and navigation bridge (`window.portfolioNavigateTo`).

## 3. Data Model

### 3.1 Stable IDs for automation

Every entry intended for selection/navigation has:

- `id`: stable internal identifier
- `slug`: human-friendly stable alias
- `title`, `summary`, `details`
- `skills`
- optional `links`

This enables deterministic front-end navigation from chatbot commands.

### 3.2 Scene model

The scene runs on:

- `InformationSceneCategory`
  - `id` (e.g. `work`)
  - `modelIndex` (which 3D model slot)
  - `subcategories[]`
- `InformationSceneSubcategory`
  - `id`, `label`, `items[]`
- `InformationSceneItem`
  - card-level information used for card rendering + details panel

## 4. Runtime Flow

1. Load EXR environment and 3D models.
2. Arrange models in circular ring.
3. Auto-orbit camera while no model is focused.
4. On model click:
   - set focused model
   - generate cards for that category
5. Each frame while focused:
   - compute anchor behind model relative to camera
   - place rows of cards in circular layout around anchor
6. On card click:
   - emit `InformationItemSelection`
   - React panel displays full details

## 5. Navigation API (Chatbot-ready)

A global command is exposed in `SpaceShowcase`:

```ts
window.portfolioNavigateTo?.({ categoryId: 'work' });
window.portfolioNavigateTo?.({ categoryId: 'work', subcategoryId: 'companies' });
window.portfolioNavigateTo?.({
  categoryId: 'work',
  subcategoryId: 'companies',
  itemId: 'company-example'
});
```

Accepted target type:

- `categoryId` required
- `subcategoryId` optional
- `itemId` optional (`id` or `slug`)

Resolution is handled by `resolveNavigationTarget(...)`.

## 6. Mapping Constraints

`sceneInformationCategories` maps category -> `modelIndex`.

At startup, `validateSceneCategoryMappings(...)` checks:

- index in bounds
- duplicate index usage

Warnings are logged in console if invalid.

## 7. How To Add New Information

1. Add/update entries in `src/features/information/data/*.json`.
2. Ensure each item has unique `id` and `slug`.
3. Ensure it appears in the correct subcategory in `src/features/information/index.ts`.
4. If a new top-level category is added, map it to a model index.

## 8. Current v0 Tradeoffs

- Card textures are canvas-generated per focused category (simple and fast to iterate).
- Details panel is 2D HTML UI (not embedded 3D UI).
- Personal category is intentionally minimal/empty for now.

## 9. Recommended Next Steps

- Add card hover highlight and selection animation.
- Add line connectors from model to subcategory rows.
- Add pagination if subcategory item counts become large.
- Add URL sync (`?category=&subcategory=&item=`) for shareable deep links.
