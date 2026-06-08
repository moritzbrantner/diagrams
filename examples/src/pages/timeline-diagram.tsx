import { TimelineDiagram } from "@moritzbrantner/diagrams/timeline-diagram";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("timeline-diagram");

const items = [
  { id: "scope-time", date: "2026-04-01", label: "Scope", kind: "milestone" },
  { id: "beta-time", date: "2026-04-10", label: "Beta", kind: "release", tone: "accent" },
  { id: "ga-time", date: "2026-04-24", label: "GA", kind: "deadline", tone: "success" },
] satisfies ComponentProps<typeof TimelineDiagram>["items"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <TimelineDiagram ariaLabel={page.ariaLabel} items={items} />
  </DiagramPageShell>,
);
