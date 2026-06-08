import { MindMap } from "@moritzbrantner/diagrams/mind-map";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("mind-map");

const root = {
  id: "diagrams-root",
  label: "Diagrams",
  tone: "accent",
  children: [
    { id: "structure-mind", label: "Structure" },
    { id: "workflow-mind", label: "Workflow" },
    { id: "planning-mind", label: "Planning" },
    { id: "systems-mind", label: "Systems" },
  ],
} satisfies ComponentProps<typeof MindMap>["root"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <MindMap ariaLabel={page.ariaLabel} root={root} />
  </DiagramPageShell>,
);
