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
