# Repository agent guidance

This repository follows the shared `coding-agent-conventions` stack.

Apply, in order of specificity:

1. Repository-local rules in this file.
2. TypeScript and React conventions from `coding-agent-conventions`.
3. Interface-design, testing, benchmarking, dependency, and repository conventions.
4. Next.js conventions only when changing a Next.js consumer/example; this package itself is framework-agnostic.

## Repository boundaries

- `src/core.ts` is the server-safe model/state surface. It must not import React, React DOM, browser globals, or interactive components.
- `src/react.ts` is the explicit interactive React surface.
- Keep the root entry point for compatibility, but new consumers that need server/client separation should prefer `/core` and `/react`.
- This repository owns authored structural diagrams, graph interaction, routing, and diagram-specific geometry.
- Do not add `viz-engine`, `charts`, or another visualization meta-layer as an implementation dependency.
- Do not add Rust/WASM speculatively. Add a local acceleration crate only after a representative benchmark identifies a diagram-specific hotspot.

## Interaction and accessibility

- Keep durable diagram state controlled and serializable; routing and URL ownership stay in consuming applications.
- Interactive diagrams must preserve keyboard and touch workflows.
- When a diagram carries information, expose an equivalent structured node/edge representation suitable for lists, tables, or other semantic views.

## Work style

- Colocate focused tests with the smallest production scope they cover when touching existing broad tests.
- Add executable evidence for behavior changes.
- Reuse `@moritzbrantner/ui` primitives for generic UI rather than creating local replacements.
