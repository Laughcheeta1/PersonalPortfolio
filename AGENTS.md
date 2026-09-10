# Project instructions

- Use pnpm for JavaScript dependencies and uv for Python tooling. Never use npm or pip.
- For non-trivial tasks, maintain an execution plan, use focused subagents where useful, and verify the result before completion.
- Preserve unrelated user changes. Keep architecture simple, typed, modular, and data-driven.
- Centralize gameplay, camera, animation, audio, biome, and performance tuning.
- At handoff, list every changed file with its added/modified/deleted status.
- End user-facing responses with “Mon Coeur”.

## Lessons

- Treat supplied visual references as acceptance criteria, not merely thematic inspiration. Review rendered assets against their silhouettes, materials, and distinctive details before describing them as finished; an initial primitive blockout is not reference fidelity.
- Keep character roles explicit when applying visual changes: changing the visitor avatar does not implicitly change the companion.
- Treat an explicit UI-preservation request as an immutability boundary: preserve existing visual design and 3D model geometry, and limit changes to data or service wiring unless the user explicitly expands the scope.
- For long-running Nx serve tasks, disable the Terminal UI and stream output to stdout. TUI mode pipes `run-commands` logs until the process exits, so Vite/Uvicorn never print.
- Do not nest `pnpm exec` under `pnpm exec nx` for serve processes. The child can block on the parent pnpm lock and never bind or log; invoke the local binary with `node` instead.
- When explaining interactive 3D UI, distinguish scene rendering from DOM/CSS3D overlays and verify whether data is fetched during initialization or interaction.
- Treat front/back content as separate product roles: keep all relevant information on the front and reserve backsides for explicitly requested secrets, jokes, or easter eggs.
- When authored content is requested from the backend, keep the source documents server-side and make the frontend consume the backend contract rather than duplicating the assets.
- Confirm the repository's available deployment refs before discussing branch operations; never suggest creating or pushing a branch unless the user explicitly requests it.
- Distinguish a managed source deployment from a user-managed container image; honor the requested deployment abstraction and avoid adding container build artifacts when the platform can deploy the application source directly.
- For deployment requests, prefer the smallest platform-native command that satisfies the target; do not add image registries or extra build layers unless the user asks for them.
