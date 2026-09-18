import { DependencyGraph } from "@moritzbrantner/diagrams/dependency-graph";
import {
  getDurableDiagramInteractionProps,
  useDiagramViewState,
} from "@moritzbrantner/diagrams/react";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("dependency-graph");

const nodes = [
  { id: "app", label: "App", group: "Consumer", status: "active", x: 0, y: 90 },
  {
    id: "diagrams",
    label: "Diagrams",
    group: "Package",
    version: "0.1",
    status: "stable",
    x: 280,
    y: 0,
  },
  { id: "ui", label: "UI", group: "Peer", version: "0.9", status: "stable", x: 560, y: 90 },
  { id: "react", label: "React", group: "Peer", version: "19", status: "stable", x: 280, y: 180 },
] satisfies ComponentProps<typeof DependencyGraph>["nodes"];

const edges = [
  { id: "app-diagrams", source: "app", target: "diagrams", label: "imports", kind: "runtime" },
  { id: "diagrams-ui", source: "diagrams", target: "ui", label: "styles", kind: "peer" },
  { id: "diagrams-react", source: "diagrams", target: "react", label: "renders", kind: "peer" },
] satisfies ComponentProps<typeof DependencyGraph>["edges"];

const nodeLabels = new Map(nodes.map((node) => [node.id, node.label]));

function DependencyImpactExample() {
  const [viewState, dispatchViewDelta] = useDiagramViewState();
  const durableInteractionProps = getDurableDiagramInteractionProps(viewState, dispatchViewDelta);
  const selectedNodeId =
    viewState.highlightedElement?.kind === "node" ? viewState.highlightedElement.id : null;

  return (
    <div className="grid min-w-0 gap-3">
      <div
        className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-muted/30 p-3"
      >
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold">Failure impact explorer</h2>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Select a dependency to pin the packages that would be affected if it disappeared. Hover
            and focus remain temporary previews; only selection changes the durable view.
          </p>
          <p
            className="text-xs text-muted-foreground"
            aria-live="polite"
            data-testid="dependency-impact-status"
          >
            {selectedNodeId
              ? `Pinned failure: ${nodeLabels.get(selectedNodeId) ?? selectedNodeId}`
              : "Select a dependency to inspect its dependents."}
          </p>
        </div>
        <button
          type="button"
          disabled={!selectedNodeId}
          data-testid="dependency-clear-impact"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => dispatchViewDelta({ type: "highlighted-element", element: null })}
        >
          Clear impact
        </button>
      </div>

      <DependencyGraph
        {...durableInteractionProps}
        ariaLabel={page.ariaLabel}
        nodes={nodes}
        edges={edges}
        showLegend
        selectedNodeId={selectedNodeId}
        interactiveFeatures={{
          controls: "always",
          pathHighlight: { mode: "incoming" },
          viewport: true,
        }}
        onNodeSelect={(node) =>
          dispatchViewDelta({
            type: "highlighted-element",
            element: { kind: "node", id: node.id },
          })
        }
        onNodeDeselect={() => dispatchViewDelta({ type: "highlighted-element", element: null })}
      />
    </div>
  );
}

renderDiagramPage(
  <DiagramPageShell page={page}>
    <DependencyImpactExample />
  </DiagramPageShell>,
);
