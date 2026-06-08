import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { GanttChart } from "../gantt-chart";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const GanttChartStory: ComponentsStory = {
  name: "Gantt Chart",
  render: () => (
    <StoryFrame>
      <GanttChart
        ariaLabel="Story Gantt chart"
        tasks={[
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
            description: "Build primitives",
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
        ]}
        startDate="2026-04-01"
        endDate="2026-04-24"
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story Gantt chart" })).toBeVisible();
    await expect(canvas.getByText("Component work")).toBeVisible();
    await expect(canvas.getAllByText("Deadline")).toHaveLength(3);
  },
};

export const InteractiveGanttChartStory: ComponentsStory = {
  name: "Interactive Gantt Chart",
  render: () => <InteractiveGanttChartDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive Gantt chart" })).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: "Inspect task" })[0]);
  },
};

function InteractiveGanttChartDemo() {
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>("brief");

  return (
    <StoryFrame>
      <GanttChart
        ariaLabel="Interactive Gantt chart"
        selectedTaskId={selectedTaskId}
        onTaskSelect={(task) => setSelectedTaskId(task.id)}
        todayDate="2026-04-08"
        taskActions={[
          { id: "inspect", label: "Inspect task", icon: <InfoIcon aria-hidden="true" /> },
        ]}
        tasks={[
          { id: "brief", label: "Brief", startDate: "2026-04-01", endDate: "2026-04-04" },
          { id: "build", label: "Build", startDate: "2026-04-05", endDate: "2026-04-14" },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-20"
      />
    </StoryFrame>
  );
}
