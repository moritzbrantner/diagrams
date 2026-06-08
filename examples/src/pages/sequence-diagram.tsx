import { SequenceDiagram } from "@moritzbrantner/diagrams/sequence-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("sequence-diagram");

const participants = [
  { id: "client", label: "Client", description: "Browser" },
  { id: "api", label: "API", description: "Gateway", tone: "accent" },
  { id: "orders", label: "Orders", description: "Domain service" },
] satisfies ComponentProps<typeof SequenceDiagram>["participants"];

const messages = [
  { id: "request", from: "client", to: "api", label: "POST /orders" },
  { id: "command", from: "api", to: "orders", label: "Create order", kind: "async" },
  { id: "result", from: "orders", to: "api", label: "Accepted", kind: "return" },
] satisfies ComponentProps<typeof SequenceDiagram>["messages"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <SequenceDiagram ariaLabel={page.ariaLabel} participants={participants} messages={messages} />
  </DiagramPageShell>,
);
