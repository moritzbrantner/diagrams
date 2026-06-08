import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { ArchitectureDiagram } from "../architecture-diagram";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const ArchitectureDiagramStory: ComponentsStory = {
  name: "Architecture Diagram",
  render: () => (
    <StoryFrame>
      <ArchitectureDiagram
        ariaLabel="Story architecture diagram"
        boundaries={[{ id: "platform", label: "Platform" }]}
        nodes={[
          { id: "gateway", label: "Gateway", kind: "gateway", boundaryId: "platform", x: 0, y: 40 },
          {
            id: "orders",
            label: "Orders",
            kind: "service",
            boundaryId: "platform",
            x: 260,
            y: 40,
            tone: "accent",
          },
          {
            id: "db",
            label: "Orders DB",
            kind: "database",
            boundaryId: "platform",
            x: 260,
            y: 190,
          },
        ]}
        connections={[
          { id: "gateway-orders", source: "gateway", target: "orders", label: "command" },
          { id: "orders-db", source: "orders", target: "db", label: "writes", kind: "data" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story architecture diagram" })).toBeVisible();
    await expect(canvas.getByText("Orders DB")).toBeVisible();
  },
};

export const InteractiveArchitectureDiagramStory: ComponentsStory = {
  name: "Interactive Architecture Diagram",
  render: () => <InteractiveArchitectureDiagramDemo />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("group", { name: "Interactive architecture diagram" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Expand Platform" }));
  },
};

function InteractiveArchitectureDiagramDemo() {
  const [collapsedBoundaryIds, setCollapsedBoundaryIds] = React.useState<string[]>(["platform"]);

  return (
    <StoryFrame>
      <ArchitectureDiagram
        ariaLabel="Interactive architecture diagram"
        collapsedBoundaryIds={collapsedBoundaryIds}
        onCollapsedBoundaryIdsChange={setCollapsedBoundaryIds}
        boundaries={[{ id: "platform", label: "Platform" }]}
        nodes={[
          { id: "gateway", label: "Gateway", kind: "gateway", boundaryId: "platform", x: 0, y: 40 },
          { id: "orders", label: "Orders", kind: "service", boundaryId: "platform", x: 260, y: 40 },
          { id: "user", label: "User", kind: "user", x: 560, y: 40 },
        ]}
        connections={[{ id: "user-gateway", source: "user", target: "gateway", label: "uses" }]}
        selectedNodeId="user"
        onNodeSelect={() => undefined}
        nodeActions={[
          { id: "inspect", label: "Inspect node", icon: <InfoIcon aria-hidden="true" /> },
        ]}
      />
    </StoryFrame>
  );
}
