# Release Checklist

## Every release

- `bun run verify`
- `bun run verify:release`
- `npm publish --dry-run --provenance --access public`
- Changeset present for package-facing changes.
- Public API report updated intentionally when `etc/diagrams.api.md` changes.
- Changelog entry explains migration steps for breaking changes.

## Performance budget

`bun run bench:diagrams` enforces CI-safe large-diagram scenarios. Each listed
operation must complete within 1,500 ms by default:

- `diagrams.org.visible.large`
- `diagrams.relationship.render.large`
- `diagrams.uml.bounds.large`
- `diagrams.gantt.render.large`

Scheduled and release CI runs may opt into the full benchmark matrix with
`DIAGRAMS_BENCH_FULL=1`.

## `1.0` readiness

Declare `1.0` only after:

- public npm publishing has succeeded through CI
- README install instructions match the npm package
- TypeDoc is published from the GitHub Pages artifact
- the public API report is enforced in CI
- packed package runtime and type consumer checks pass
- Playwright covers desktop and mobile examples
- accessibility scans pass for documented examples
- security, contribution, issue, and pull request templates are present
- changelog updates are generated through Changesets
- at least one non-prerelease public npm release has shipped
- public API names and component props have been reviewed and accepted
