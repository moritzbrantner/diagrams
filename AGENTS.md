# Repository agent guidance

This repository follows the shared `coding-agent-conventions` stack.

Apply, in order of specificity:

1. Repository-local rules in this file.
2. TypeScript and React conventions from `coding-agent-conventions`.
3. Interface-design, testing, benchmarking, dependency, and repository conventions.
4. Next.js conventions only when changing a Next.js consumer/example; this package itself is framework-agnostic.

## Repository boundaries

- `crates/diagrams-core` owns renderer-independent validation, deterministic layout, routing, spatial bounds, viewport culling, and other performance-sensitive diagram computation.
- `crates/diagrams-wasm` is transport only. Keep semantic decisions in `diagrams-core`; the WASM crate translates values between JavaScript and Rust.
- `src/core.ts` is the server-safe TypeScript model/state surface. It must not import React, React DOM, browser globals, or interactive components.
- `src/react.ts` is the explicit interactive React surface. React owns rendering, accessibility, pointer/keyboard input, controlled state, and browser integration; it must not become a competing layout engine.
- Keep the root entry point for compatibility, but new consumers that need server/client separation should prefer `/core` and `/react`.
- This repository owns authored structural diagrams, graph interaction, routing, and diagram-specific geometry.
- Do not add `viz-engine`, `charts`, or another visualization meta-layer as an implementation dependency.
- New renderer-independent geometry should be implemented once in `diagrams-core` and exposed through the thin runtime boundary. Avoid TypeScript/Rust forks of the same layout or routing semantics.
- Explicit author coordinates and waypoints remain valid compatibility inputs; acceleration must not silently overwrite authored geometry.

## Interaction and accessibility

- Keep durable diagram state controlled and serializable; routing and URL ownership stay in consuming applications.
- Interactive diagrams must preserve keyboard and touch workflows.
- When a diagram carries information, expose an equivalent structured node/edge representation suitable for lists, tables, or other semantic views.
- Performance work must preserve semantic and accessible alternatives rather than making the canvas the sole source of truth.

## Performance and evidence

- Exercise the Rust core against representative graphs with at least hundreds of nodes and edges before changing core algorithms.
- Keep viewport culling and other large-data optimizations deterministic and idempotent.
- Add executable evidence for visual-layout fixes: geometry tests in Rust plus browser/example coverage for the adapter that consumes the geometry.

## Work style

- Colocate focused tests with the smallest production scope they cover when touching existing broad tests.
- Add executable evidence for behavior changes.
- Reuse `@moritzbrantner/ui` primitives for generic UI rather than creating local replacements.
