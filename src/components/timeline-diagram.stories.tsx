import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { StoryFrame, type ComponentsStory } from "../testing/storybook";
import { TimelineDiagram } from "../timeline-diagram";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const TimelineDiagramStory: ComponentsStory = {
  name: "Timeline Diagram",
  render: () => (
    <StoryFrame>
      <TimelineDiagram
        ariaLabel="Story timeline diagram"
        items={[
          { id: "scope", date: "2026-04-01", label: "Scope" },
          { id: "beta", date: "2026-04-10", label: "Beta", tone: "accent" },
          { id: "ga", date: "2026-04-24", label: "GA", tone: "success" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story timeline diagram" })).toBeVisible();
    await expect(canvas.getByText("Beta")).toBeVisible();
  },
};

export const InteractiveTimelineDiagramStory: ComponentsStory = {
  name: "Interactive Timeline Diagram",
  render: () => <InteractiveTimelineDiagramDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive timeline diagram" })).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: "Inspect item" })[0]);
  },
};

function InteractiveTimelineDiagramDemo() {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>("beta");

  return (
    <StoryFrame>
      <TimelineDiagram
        ariaLabel="Interactive timeline diagram"
        selectedItemId={selectedItemId}
        onItemSelect={(item) => setSelectedItemId(item.id)}
        groupBy="month"
        itemActions={[
          { id: "inspect", label: "Inspect item", icon: <InfoIcon aria-hidden="true" /> },
        ]}
        items={[
          { id: "scope", date: "2026-04-01", label: "Scope" },
          { id: "beta", date: "2026-04-10", label: "Beta", tone: "accent" },
          { id: "ga", date: "2026-04-24", label: "GA", tone: "success" },
        ]}
      />
    </StoryFrame>
  );
}
