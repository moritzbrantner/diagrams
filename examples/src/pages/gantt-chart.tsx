import { GanttChart } from "@moritzbrantner/diagrams/gantt-chart";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("gantt-chart");

const tasks = [
  {
    id: "brief",
    label: "Release brief",
    description: "Scope and approval",
    startDate: "2026-04-01",
    endDate: "2026-04-04",
    earliestStartDate: "2026-04-01",
    deadlineDate: "2026-04-05",
    progress: 1,
    tone: "success",
  },
  {
    id: "components",
    label: "Component work",
    description: "Build diagram primitives",
    startDate: "2026-04-04",
    endDate: "2026-04-14",
    earliestStartDate: "2026-04-03",
    deadlineDate: "2026-04-16",
    progress: 0.68,
  },
  {
    id: "validation",
    label: "Validation",
    description: "Tests and docs",
    startDate: "2026-04-15",
    endDate: "2026-04-22",
    earliestStartDate: "2026-04-12",
    deadlineDate: "2026-04-21",
    progress: 0.3,
    tone: "warning",
  },
] satisfies ComponentProps<typeof GanttChart>["tasks"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <GanttChart
      ariaLabel={page.ariaLabel}
      caption="Earliest starts and deadlines are marked per task."
      tasks={tasks}
      startDate="2026-04-01"
      endDate="2026-04-24"
    />
  </DiagramPageShell>,
);
