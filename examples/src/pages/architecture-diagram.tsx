import { ArchitectureDiagram } from "@moritzbrantner/diagrams/architecture-diagram";

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
