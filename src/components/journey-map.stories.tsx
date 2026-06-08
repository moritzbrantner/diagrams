import { expect } from "storybook/test";

import { JourneyMap } from "../journey-map";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const JourneyMapStory: ComponentsStory = {
  name: "Journey Map",
  render: () => (
    <StoryFrame>
      <JourneyMap
        ariaLabel="Story journey map"
        phases={[
          { id: "discover", label: "Discover" },
          { id: "adopt", label: "Adopt", tone: "accent" },
          { id: "ship", label: "Ship" },
        ]}
        touchpoints={[
          { id: "docs", phaseId: "discover", label: "Read docs", sentiment: "positive" },
          { id: "model", phaseId: "adopt", label: "Model data", sentiment: "neutral" },
          { id: "verify", phaseId: "ship", label: "Run verify", sentiment: "positive" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("grid", { name: "Story journey map" })).toBeVisible();
    await expect(canvas.getByText("Model data")).toBeVisible();
  },
};
