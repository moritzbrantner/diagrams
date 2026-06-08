import { SwimlaneDiagram } from "@moritzbrantner/diagrams/swimlane-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("swimlane-diagram");

const lanes = [
  { id: "product", label: "Product", description: "Defines intent" },
  { id: "engineering", label: "Engineering", description: "Ships package" },
  { id: "quality", label: "Quality", description: "Checks release" },
] satisfies ComponentProps<typeof SwimlaneDiagram>["lanes"];

const steps = [
  { id: "brief-step", laneId: "product", label: "Brief", status: "done", tone: "success" },
  { id: "build-step", laneId: "engineering", label: "Build", status: "active", tone: "accent" },
  { id: "test-step", laneId: "quality", label: "Validate", status: "warning", tone: "warning" },
] satisfies ComponentProps<typeof SwimlaneDiagram>["steps"];

const connectors = [
  { id: "brief-build", source: "brief-step", target: "build-step", label: "hands off" },
  { id: "build-test", source: "build-step", target: "test-step", label: "candidate", kind: "risk" },
] satisfies ComponentProps<typeof SwimlaneDiagram>["connectors"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <SwimlaneDiagram
      ariaLabel={page.ariaLabel}
      lanes={lanes}
      steps={steps}
      connectors={connectors}
    />
  </DiagramPageShell>,
);
