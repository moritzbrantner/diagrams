import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { StateMachineDiagram } from "../state-machine-diagram";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const StateMachineDiagramStory: ComponentsStory = {
  name: "State Machine Diagram",
  render: () => (
    <StoryFrame>
      <StateMachineDiagram
        ariaLabel="Story state machine diagram"
        states={[
          { id: "initial", label: "Initial", kind: "initial", x: 0, y: 24 },
          { id: "draft", label: "Draft", x: 150, y: 0 },
          { id: "review", label: "Review", x: 420, y: 0, tone: "accent" },
          { id: "final", label: "Final", kind: "final", x: 700, y: 24 },
        ]}
        transitions={[
          { id: "start", source: "initial", target: "draft", event: "create" },
          { id: "submit", source: "draft", target: "review", event: "submit" },
          { id: "approve", source: "review", target: "final", event: "approve" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story state machine diagram" })).toBeVisible();
    await expect(canvas.getByText("Review")).toBeVisible();
  },
};

export const InteractiveStateMachineDiagramStory: ComponentsStory = {
  name: "Interactive State Machine Diagram",
  render: () => <InteractiveStateMachineDiagramDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive state machine" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect draft" }));
  },
};

function InteractiveStateMachineDiagramDemo() {
  const [selectedStateId, setSelectedStateId] = React.useState<string | null>("draft");

  return (
    <StoryFrame>
      <StateMachineDiagram
        ariaLabel="Interactive state machine"
        selectedStateId={selectedStateId}
        onStateSelect={(state) => setSelectedStateId(state.id)}
        stateActions={(state) => [
          { id: "inspect", label: `Inspect ${state.id}`, icon: <InfoIcon aria-hidden="true" /> },
        ]}
        states={[
          { id: "draft", label: "Draft", x: 0, y: 0 },
          { id: "review", label: "Review", x: 260, y: 0, tone: "accent" },
        ]}
        transitions={[
          { id: "submit", source: "draft", target: "review", event: "submit" },
          { id: "revise", source: "review", target: "review", event: "revise" },
        ]}
      />
    </StoryFrame>
  );
}
