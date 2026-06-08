import { OrgChart } from "@moritzbrantner/diagrams/org-chart";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("org-chart");

const nodes = [
  {
    id: "owner",
    label: "Program owner",
    description: "Sets release scope",
    meta: "Accountable",
    children: [
      {
        id: "design",
        label: "Design systems",
        description: "Maintains primitives",
        meta: "Consulted",
      },
      {
        id: "platform",
        label: "Frontend platform",
        description: "Validates package consumers",
        meta: "Responsible",
        children: [
          {
            id: "quality",
            label: "Quality",
            description: "Runs checks",
            meta: "Informed",
          },
        ],
      },
    ],
  },
] satisfies ComponentProps<typeof OrgChart>["nodes"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <OrgChart nodes={nodes} defaultExpandedDepth={2} selectedNodeId="platform" />
  </DiagramPageShell>,
);
