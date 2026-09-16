import { useState, type ComponentProps } from "react";

import { DecisionTree } from "@moritzbrantner/diagrams/decision-tree";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

const page = getDiagramPage("decision-tree");

const root = {
  id: "release-ready",
  label: "Release ready?",
  children: [
    {
      id: "ready-path",
      label: "Ready",
      target: {
        id: "risk-acceptable",
        label: "Risk acceptable?",
        children: [
          {
            id: "ship-path",
            label: "Low risk",
            target: { id: "ship", label: "Ship package", kind: "outcome", tone: "success" },
            tone: "success",
          },
          {
            id: "canary-path",
            label: "Needs canary",
            target: { id: "canary", label: "Run canary", kind: "action", tone: "warning" },
            tone: "warning",
          },
        ],
      },
      tone: "success",
    },
    {
      id: "blocked-path",
      label: "Blocked",
      target: {
        id: "blocker-type",
        label: "Main blocker?",
        children: [
          {
            id: "tests-path",
            label: "Tests",
            target: {
              id: "fix-tests",
              label: "Fix failing tests",
              kind: "action",
              tone: "warning",
            },
            tone: "warning",
          },
          {
            id: "dependencies-path",
            label: "Dependencies",
            target: {
              id: "fix-dependencies",
              label: "Update dependencies",
              kind: "action",
              tone: "warning",
            },
            tone: "warning",
          },
        ],
      },
      tone: "warning",
    },
  ],
} satisfies ComponentProps<typeof DecisionTree>["root"];

const nodeLabels = new Map([
  ["release-ready", "Release ready?"],
  ["risk-acceptable", "Risk acceptable?"],
  ["ship", "Ship package"],
  ["canary", "Run canary"],
  ["blocker-type", "Main blocker?"],
  ["fix-tests", "Fix failing tests"],
  ["fix-dependencies", "Update dependencies"],
]);

function DecisionTreeInteractionExample() {
  const [trailNodeId, setTrailNodeId] = useState<string | null>("canary");

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold">Decision walkthrough</h2>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Choose a branch to trace the exact reasoning path back to the root. Branches remain
            keyboard-selectable, so the walkthrough does not depend on pointer input.
          </p>
          <p
            className="text-xs text-muted-foreground"
            aria-live="polite"
            data-testid="decision-trail-status"
          >
            {trailNodeId
              ? `Route ends at: ${nodeLabels.get(trailNodeId) ?? trailNodeId}`
              : "No route selected."}
          </p>
        </div>
        <button
          type="button"
          data-testid="decision-clear-route"
          disabled={!trailNodeId}
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setTrailNodeId(null)}
        >
          Clear route
        </button>
      </div>

      <DecisionTree
        ariaLabel={page.ariaLabel}
        root={root}
        interactiveFeatures={{
          controls: "always",
          pathHighlight: { mode: "incoming" },
          viewport: true,
        }}
        selectedNodeId={trailNodeId}
        highlightedElement={trailNodeId ? { kind: "node", id: trailNodeId } : null}
        onBranchSelect={(edge) => setTrailNodeId(edge.target)}
      />
    </div>
  );
}

renderDiagramPage(
  <DiagramPageShell page={page}>
    <DecisionTreeInteractionExample />
  </DiagramPageShell>,
);
