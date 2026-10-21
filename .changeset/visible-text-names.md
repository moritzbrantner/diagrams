---
"@moritzbrantner/diagrams": patch
---

Accessible names now contain their visible text (axe-core 4.14 `label-content-name-mismatch`). Selectable diagram items and dependency-graph nodes are named from their rendered content. Text toggles are named after their visible verb ("Show Platform" and "Hide Platform", which were "Expand Platform" and "Collapse Platform"). The org-chart treeitem is now the node card: it owns its children group, so its name no longer includes every descendant. Locators that used the old names need updating.
