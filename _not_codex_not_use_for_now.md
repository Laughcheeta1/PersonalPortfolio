# codex.md

## Purpose

This file describes conventions for maintaining the 3D information portfolio system.

## Core Principles

- Keep data and rendering logic separated.
- Use stable IDs/slugs for all navigation-targetable entries.
- Prefer deterministic commands over ad-hoc UI state mutations.
- Keep scene behavior frame-stable and predictable.

## Data Conventions

- Primary models: `src/features/information/models.ts`
- Data source: `src/features/information/data/*.json`
- Dates are ISO strings (`YYYY-MM-DD`).
- Every entry intended for selection must include:
  - `id`
  - `slug`
  - `title`
  - `summary`
  - `details`

## Scene Conventions

- 3D models are category anchors.
- Card boxes represent subcategory items.
- Cards are camera-relative and positioned behind focused model.
- Camera auto-orbits only in unfocused state.

## Navigation Contract

Use this payload shape everywhere (UI, chatbot bridge, automation):

```ts
{
  categoryId: 'work' | 'education' | 'projects' | 'honors' | 'skills' | 'personal',
  subcategoryId?: string,
  itemId?: string
}
```

Public bridge:

```ts
window.portfolioNavigateTo?.(target)
```

## File Ownership

- Runtime: `src/features/space/SpaceSceneRuntime.ts`
- Adapter: `src/features/information/index.ts`
- Resolver: `src/features/information/navigation.ts`
- Host UI: `src/components/SpaceShowcase.tsx`

## Quality Checks

Before finishing changes:

1. `bun run lint`
2. `bun run build`

## Maintainability Rules

- Avoid adding uncategorized data directly in UI components.
- Keep category/model mappings centralized in information adapter.
- If adding new top-level category, validate model index mapping.
- Keep new features additive and backward-compatible with navigation contract.
