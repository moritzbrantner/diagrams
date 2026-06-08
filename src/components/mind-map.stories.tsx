import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { MindMap } from "../mind-map";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const MindMapStory: ComponentsStory = {
  name: "Mind Map",
  render: () => (
    <StoryFrame>
      <MindMap
        ariaLabel="Story mind map"
        root={{
          id: "diagrams",
          label: "Diagrams",
          tone: "accent",
          children: [
            { id: "structure", label: "Structure" },
            { id: "workflow", label: "Workflow" },
            { id: "systems", label: "Systems" },
          ],
        }}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story mind map" })).toBeVisible();
    await expect(canvas.getByText("Workflow")).toBeVisible();
  },
};

export const InteractiveMindMapStory: ComponentsStory = {
  name: "Interactive Mind Map",
  render: () => <InteractiveMindMapDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive mind map" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect diagrams" }));
  },
};

function InteractiveMindMapDemo() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("diagrams");

  return (
    <StoryFrame>
      <MindMap
        ariaLabel="Interactive mind map"
        selectedNodeId={selectedNodeId}
        onNodeSelect={(node) => setSelectedNodeId(node.id)}
        nodeActions={(node) => [
          { id: "inspect", label: `Inspect ${node.id}`, icon: <InfoIcon aria-hidden="true" /> },
        ]}
        root={{
          id: "diagrams",
          label: "Diagrams",
          children: [
            { id: "workflow", label: "Workflow" },
            { id: "systems", label: "Systems" },
          ],
        }}
      />
    </StoryFrame>
  );
}
