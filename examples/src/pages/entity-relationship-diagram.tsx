import { EntityRelationshipDiagram } from "@moritzbrantner/diagrams/entity-relationship-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("entity-relationship-diagram");

const entities = [
  {
    id: "orders-table",
    name: "orders",
    fields: [
      { id: "order-id", name: "id", type: "uuid", key: "primary" },
      { id: "customer-id", name: "customer_id", type: "uuid", key: "foreign" },
      { id: "status", name: "status", type: "text" },
    ],
  },
  {
    id: "customers-table",
    name: "customers",
    x: 340,
    y: 80,
    fields: [
      { id: "customer-id-pk", name: "id", type: "uuid", key: "primary" },
      { id: "email", name: "email", type: "text", key: "unique" },
    ],
  },
] satisfies ComponentProps<typeof EntityRelationshipDiagram>["entities"];

const relations = [
  {
    id: "customers-orders",
    source: "customers-table",
    target: "orders-table",
    label: "places",
    sourceCardinality: "one",
    targetCardinality: "zero-or-many",
    identifying: true,
  },
] satisfies ComponentProps<typeof EntityRelationshipDiagram>["relations"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <EntityRelationshipDiagram
      ariaLabel={page.ariaLabel}
      entities={entities}
      relations={relations}
    />
  </DiagramPageShell>,
);
