import { ArchitectureDiagram } from "@moritzbrantner/diagrams/architecture-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("architecture-diagram");

const boundaries = [
  { id: "platform", label: "Platform" },
  { id: "external", label: "External", x: 560, y: -44, width: 236, height: 300 },
] satisfies ComponentProps<typeof ArchitectureDiagram>["boundaries"];

const nodes = [
  { id: "gateway", label: "Gateway", kind: "gateway", boundaryId: "platform", x: 0, y: 40 },
  {
    id: "orders-arch",
    label: "Orders",
    kind: "service",
    boundaryId: "platform",
    x: 260,
    y: 40,
    tone: "accent",
  },
  { id: "db", label: "Orders DB", kind: "database", boundaryId: "platform", x: 260, y: 190 },
  {
    id: "payments",
    label: "Payments",
    kind: "external",
    boundaryId: "external",
    x: 600,
    y: 100,
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

renderDiagramPage(
  <DiagramPageShell page={page}>
    <ArchitectureDiagram
      ariaLabel={page.ariaLabel}
      nodes={nodes}
      connections={connections}
      boundaries={boundaries}
    />
  </DiagramPageShell>,
);
