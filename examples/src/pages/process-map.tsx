import { ProcessMap } from "@moritzbrantner/diagrams/process-map";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("process-map");

const steps = [
  {
    id: "discover",
    label: "Discover",
    description: "Map stakeholders and decision points.",
    meta: "Complete",
    status: "done",
    tone: "success",
  },
  {
    id: "shape",
    label: "Shape",
    description: "Turn the diagram into a release plan.",
    meta: "Active",
    status: "active",
    tone: "accent",
  },
  {
    id: "share",
    label: "Share",
    description: "Publish the artifact with context.",
    meta: "Next",
    status: "pending",
  },
] satisfies ComponentProps<typeof ProcessMap>["steps"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <ProcessMap steps={steps} />
  </DiagramPageShell>,
);
