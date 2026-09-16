import { ArchitectureDiagram } from "@moritzbrantner/diagrams/architecture-diagram";
import { useState } from "react";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("architecture-diagram");

const boundaries = [
  { id: "platform", label: "Platform" },
  { id: "external", label: "External" },
] satisfies ComponentProps<typeof ArchitectureDiagram>["boundaries"];

const nodes = [
  { id: "gateway", label: "Gateway", kind: "gateway", boundaryId: "platform" },
  {
    id: "orders-arch",
    label: "Orders",
    kind: "service",
    boundaryId: "platform",
    tone: "accent",
  },
  { id: "db", label: "Orders DB", kind: "database", boundaryId: "platform" },
  {
    id: "payments",
    label: "Payments",
    kind: "external",
    boundaryId: "external",
  },
] satisfies ComponentProps<typeof ArchitectureDiagram>["nodes"];

const connections = [
  {
    id: "gateway-orders",
    source: "gateway",
    target: "orders-arch",
    label: "command",
    protocol: "HTTPS",
  },
  { id: "orders-db", source: "orders-arch", target: "db", label: "writes", kind: "data" },
  {
    id: "orders-payments",
    source: "orders-arch",
    target: "payments",
    label: "authorize",
    kind: "risk",
  },
] satisfies ComponentProps<typeof ArchitectureDiagram>["connections"];

function ArchitectureInteractionExample() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("orders-arch");
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold">Impact explorer</h2>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Select a service to pin its downstream blast radius. Hover or focus another service to
            preview its path without losing the pinned selection.
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {selectedNode ? `Pinned: ${selectedNode.label}` : "No service pinned."}
          </p>
        </div>
        <button
          type="button"
          data-testid="architecture-clear-impact"
          disabled={!selectedNodeId}
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setSelectedNodeId(null)}
        >
          Clear spotlight
        </button>
      </div>

      <ArchitectureDiagram
        ariaLabel={page.ariaLabel}
        nodes={nodes}
        connections={connections}
        boundaries={boundaries}
        interactiveFeatures={{
          controls: "always",
          pathHighlight: { mode: "outgoing" },
          viewport: true,
        }}
        selectedNodeId={selectedNodeId}
        highlightedElement={selectedNodeId ? { kind: "node", id: selectedNodeId } : null}
        onNodeSelect={(node) =>
          setSelectedNodeId((currentNodeId) => (currentNodeId === node.id ? null : node.id))
        }
        onNodeDeselect={() => setSelectedNodeId(null)}
      />
    </div>
  );
}

renderDiagramPage(
  <DiagramPageShell page={page}>
    <ArchitectureInteractionExample />
  </DiagramPageShell>,
);
