import { StateMachineDiagram } from "@moritzbrantner/diagrams/state-machine-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("state-machine-diagram");

const states = [
  { id: "initial", label: "Initial", kind: "initial", x: 0, y: 24 },
  { id: "draft", label: "Draft", x: 150, y: 0 },
  { id: "review", label: "Review", x: 420, y: 0, tone: "accent" },
  { id: "released", label: "Released", kind: "final", x: 700, y: 24 },
] satisfies ComponentProps<typeof StateMachineDiagram>["states"];

const transitions = [
  { id: "start-draft", source: "initial", target: "draft", event: "create" },
  { id: "draft-review", source: "draft", target: "review", event: "submit" },
  { id: "review-released", source: "review", target: "released", event: "approve" },
] satisfies ComponentProps<typeof StateMachineDiagram>["transitions"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <StateMachineDiagram ariaLabel={page.ariaLabel} states={states} transitions={transitions} />
  </DiagramPageShell>,
);
