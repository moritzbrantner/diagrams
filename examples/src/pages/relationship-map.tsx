import { RelationshipMap } from "@moritzbrantner/diagrams/relationship-map";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("relationship-map");

const nodes = [
  { id: "product", label: "Product", description: "Priorities", group: "Input", x: 0, y: 90 },
  {
    id: "design",
    label: "Design",
    description: "Components",
    group: "System",
    x: 280,
    y: 0,
    tone: "success",
  },
  {
    id: "engineering",
    label: "Engineering",
    description: "Package",
    group: "System",
    x: 280,
    y: 180,
  },
  {
    id: "governance",
    label: "Governance",
    description: "Approval",
    group: "Control",
    x: 560,
    y: 90,
    tone: "warning",
  },
] satisfies ComponentProps<typeof RelationshipMap>["nodes"];

const edges = [
  { id: "product-design", source: "product", target: "design", label: "briefs" },
  { id: "product-engineering", source: "product", target: "engineering", label: "prioritizes" },
  {
    id: "engineering-governance",
    source: "engineering",
    target: "governance",
    label: "submits",
    kind: "risk",
  },
] satisfies ComponentProps<typeof RelationshipMap>["edges"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <RelationshipMap
      ariaLabel={page.ariaLabel}
      caption="Labeled edges keep dependency intent visible."
      nodes={nodes}
      edges={edges}
    />
  </DiagramPageShell>,
);
