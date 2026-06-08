import { expect } from "storybook/test";

import { OrgChart } from "../org-chart";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const OrgChartStory: ComponentsStory = {
  name: "Org Chart",
  render: () => (
    <StoryFrame>
      <OrgChart
        nodes={[
          {
            id: "owner",
            label: "Program owner",
            description: "Sets release scope",
            children: [
              { id: "design", label: "Design systems", description: "Maintains primitives" },
              {
                id: "platform",
                label: "Frontend platform",
                description: "Validates package consumers",
                children: [{ id: "quality", label: "Quality", description: "Runs checks" }],
              },
            ],
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("treeitem", { name: "Program owner" })).toBeVisible();
    await expect(canvas.getByText("Quality")).toBeVisible();
  },
};
