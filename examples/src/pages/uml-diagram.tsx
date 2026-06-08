import { UmlDiagram } from "@moritzbrantner/diagrams/uml-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("uml-diagram");

const nodes = [
  { id: "api", label: "API Gateway", description: "Routes authenticated requests.", x: 0, y: 0 },
  {
    id: "orders",
    label: "Orders Service",
    description: "Owns lifecycle commands and state.",
    variant: "accent",
    x: 292,
    y: 0,
  },
  {
    id: "billing",
    label: "Billing Adapter",
    description: "Maps domain requests onto provider APIs.",
    variant: "muted",
    x: 584,
    y: 0,
  },
  {
    id: "events",
    label: "Event Stream",
    description: "Publishes lifecycle changes.",
    variant: "warning",
    x: 292,
    y: 192,
  },
] satisfies ComponentProps<typeof UmlDiagram>["nodes"];

const edges = [
  { id: "api-orders", source: "api", target: "orders", label: "command", direction: "forward" },
  {
    id: "orders-billing",
    source: "orders",
    target: "billing",
    label: "authorizes",
    kind: "dependency",
    direction: "forward",
  },
  {
    id: "orders-events",
    source: "orders",
    target: "events",
    label: "publishes",
    direction: "forward",
  },
] satisfies ComponentProps<typeof UmlDiagram>["edges"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <UmlDiagram
      ariaLabel={page.ariaLabel}
      caption="Directed dependencies make service boundaries explicit."
      nodes={nodes}
      edges={edges}
    />
  </DiagramPageShell>,
);
