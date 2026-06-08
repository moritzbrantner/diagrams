import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { DecisionTree } from "../decision-tree";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const DecisionTreeStory: ComponentsStory = {
  name: "Decision Tree",
  render: () => (
    <StoryFrame>
      <DecisionTree
        ariaLabel="Story decision tree"
        root={{
          id: "ready",
          label: "Ready?",
          children: [
            {
              id: "yes",
              label: "Yes",
              target: { id: "ship", label: "Ship", kind: "outcome", tone: "success" },
            },
            {
              id: "no",
              label: "No",
              target: { id: "fix", label: "Fix blockers", kind: "action", tone: "warning" },
            },
          ],
        }}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story decision tree" })).toBeVisible();
    await expect(canvas.getByText("Fix blockers")).toBeVisible();
  },
};

export const InteractiveDecisionTreeStory: ComponentsStory = {
  name: "Interactive Decision Tree",
  render: () => <InteractiveDecisionTreeDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive decision tree" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect ready" }));
  },
};

function InteractiveDecisionTreeDemo() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("ready");
  const [expandedNodeIds, setExpandedNodeIds] = React.useState<string[]>(["ready"]);

  return (
    <StoryFrame>
      <DecisionTree
        ariaLabel="Interactive decision tree"
        selectedNodeId={selectedNodeId}
        onNodeSelect={(node) => setSelectedNodeId(node.id)}
        expandedNodeIds={expandedNodeIds}
        onExpandedNodeIdsChange={setExpandedNodeIds}
        nodeActions={(node) => [
          { id: "inspect", label: `Inspect ${node.id}`, icon: <InfoIcon aria-hidden="true" /> },
        ]}
        root={{
          id: "ready",
          label: "Ready?",
          children: [
            {
              id: "yes",
              label: "Yes",
              target: { id: "ship", label: "Ship", kind: "outcome" },
            },
          ],
        }}
      />
    </StoryFrame>
  );
}
