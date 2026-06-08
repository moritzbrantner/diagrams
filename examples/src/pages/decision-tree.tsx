import { DecisionTree } from "@moritzbrantner/diagrams/decision-tree";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("decision-tree");

const root = {
  id: "release-ready",
  label: "Release ready?",
  children: [
    {
      id: "yes-path",
      label: "Yes",
      target: { id: "ship", label: "Ship package", kind: "outcome", tone: "success" },
      tone: "success",
    },
    {
      id: "no-path",
      label: "No",
      target: { id: "fix", label: "Fix blockers", kind: "action", tone: "warning" },
      tone: "warning",
    },
  ],
} satisfies ComponentProps<typeof DecisionTree>["root"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <DecisionTree ariaLabel={page.ariaLabel} root={root} />
  </DiagramPageShell>,
);
