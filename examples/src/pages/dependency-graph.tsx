import { DependencyGraph } from "@moritzbrantner/diagrams/dependency-graph";

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

renderDiagramPage(
  <DiagramPageShell page={page}>
    <DependencyGraph ariaLabel={page.ariaLabel} nodes={nodes} edges={edges} showLegend />
  </DiagramPageShell>,
);
