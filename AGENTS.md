# Repository agent guidance

This repository follows the applicable rules from `moritzbrantner/coding-agent-conventions`.

## Scope

- Keep authored structural diagrams, graph interaction, routing, and layout semantics owned here.
- Do not add `viz-engine`. Do not add a Rust/WASM layer until a named benchmark shows a diagram hotspot that benefits from it.
- Keep `src/core.ts` free of runtime React imports. React rendering and interactive components belong under `src/react.ts` and the existing component entrypoints.
- Keep router concerns outside the package. Durable viewport/search/highlight state may be encoded and decoded, while applications own URL synchronization.
- Prefer controlled composition over adding unrelated feature flags to already-large diagram components.
- Reuse `@moritzbrantner/ui` public primitives and one concrete theme contract rather than creating local UI primitives.
- Place new focused tests beside the smallest source scope they cover; do not grow legacy aggregate test files unnecessarily.

## Validation

Start narrow, then widen:

1. Focused Vitest for the changed diagram or helper.
2. `bun run check-types`, `bun run lint`, and `bun run format:check`.
3. `bun run test`.
4. `bun run build` and `bun run pack:check`.
5. Use `bun run verify` for the broad repository gate.

Publication and version bumps are release work, not ordinary feature development.
