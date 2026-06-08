import { expect } from "storybook/test";

import { SequenceDiagram } from "../sequence-diagram";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const SequenceDiagramStory: ComponentsStory = {
  name: "Sequence Diagram",
  render: () => (
    <StoryFrame>
      <SequenceDiagram
        ariaLabel="Story sequence diagram"
        participants={[
          { id: "client", label: "Client" },
          { id: "api", label: "API", tone: "accent" },
          { id: "orders", label: "Orders" },
        ]}
        messages={[
          { id: "request", from: "client", to: "api", label: "POST /orders" },
          { id: "command", from: "api", to: "orders", label: "Create order", kind: "async" },
          { id: "result", from: "orders", to: "api", label: "Accepted", kind: "return" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story sequence diagram" })).toBeVisible();
    await expect(canvas.getByText("Create order")).toBeVisible();
  },
};
