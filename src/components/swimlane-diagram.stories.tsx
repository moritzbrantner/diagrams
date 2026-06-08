import { expect } from "storybook/test";

import { SwimlaneDiagram } from "../swimlane-diagram";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const SwimlaneDiagramStory: ComponentsStory = {
  name: "Swimlane Diagram",
  render: () => (
    <StoryFrame>
      <SwimlaneDiagram
        ariaLabel="Story swimlane diagram"
        lanes={[
          { id: "product", label: "Product" },
          { id: "engineering", label: "Engineering" },
          { id: "quality", label: "Quality" },
        ]}
        steps={[
          { id: "brief", laneId: "product", label: "Brief", status: "done", tone: "success" },
          { id: "build", laneId: "engineering", label: "Build", status: "active", tone: "accent" },
          {
            id: "validate",
            laneId: "quality",
            label: "Validate",
            status: "warning",
            tone: "warning",
          },
        ]}
        connectors={[
          { id: "brief-build", source: "brief", target: "build", label: "handoff" },
          {
            id: "build-validate",
            source: "build",
            target: "validate",
            label: "candidate",
            kind: "risk",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story swimlane diagram" })).toBeVisible();
    await expect(canvas.getByText("Validate")).toBeVisible();
  },
};
