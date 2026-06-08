import { InfoIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { RelationshipMap } from "../relationship-map";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

const relationshipNodes = [
  { id: "product", label: "Product", description: "Priorities", x: 0, y: 90 },
  { id: "design", label: "Design", description: "Components", x: 280, y: 0, tone: "success" },
  { id: "engineering", label: "Engineering", description: "Package", x: 280, y: 180 },
  {
    id: "governance",
    label: "Governance",
    description: "Approval",
    x: 560,
    y: 90,
    tone: "warning",
  },
] satisfies React.ComponentProps<typeof RelationshipMap>["nodes"];

export const RelationshipMapStory: ComponentsStory = {
  name: "Relationship Map",
  render: () => (
    <StoryFrame>
      <RelationshipMap
        ariaLabel="Story relationship map"
        nodes={relationshipNodes}
        edges={[
          { id: "product-design", source: "product", target: "design", label: "briefs" },
          {
            id: "product-engineering",
            source: "product",
            target: "engineering",
            label: "prioritizes",
          },
          {
            id: "engineering-governance",
            source: "engineering",
            target: "governance",
            label: "submits",
            kind: "risk",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story relationship map" })).toBeVisible();
    await expect(canvas.getByText("Governance")).toBeVisible();
  },
};

export const InteractiveCanvasRelationshipMapStory: ComponentsStory = {
  name: "Interactive Canvas Relationship Map",
  render: () => (
    <StoryFrame>
      <RelationshipMap
        ariaLabel="Interactive canvas relationship map"
        interactiveFeatures={true}
        nodes={relationshipNodes}
        edges={[
          { id: "product-design", source: "product", target: "design", label: "briefs" },
          {
            id: "engineering-governance",
            source: "engineering",
            target: "governance",
            label: "submits",
            kind: "risk",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Search diagram" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Search diagram" }), "briefs");
    await expect(await canvas.findByText("1 / 1")).toBeVisible();
    const edge = canvasElement.querySelector('[data-slot="relationship-map-edge"]');
    if (edge instanceof Element) {
      await userEvent.hover(edge);
    }
    await expect(await canvas.findByRole("dialog")).toBeVisible();
  },
};

export const InteractiveRelationshipMapStory: ComponentsStory = {
  name: "Interactive Relationship Map",
  render: () => <InteractiveRelationshipMapDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Interactive relationship map" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect product" }));
  },
};

function InteractiveRelationshipMapDemo() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("product");

  return (
    <StoryFrame>
      <RelationshipMap
        ariaLabel="Interactive relationship map"
        selectedNodeId={selectedNodeId}
        onNodeSelect={(node) => setSelectedNodeId(node.id)}
        nodeActions={(node) => [
          { id: "inspect", label: `Inspect ${node.id}`, icon: <InfoIcon aria-hidden="true" /> },
        ]}
        nodes={[
          { id: "product", label: "Product", groupId: "team", group: "Team", x: 0, y: 80 },
          { id: "design", label: "Design", groupId: "team", group: "Team", x: 280, y: 0 },
          { id: "engineering", label: "Engineering", x: 280, y: 160 },
        ]}
        edges={[
          { id: "product-design", source: "product", target: "design", label: "briefs" },
          { id: "product-engineering", source: "product", target: "engineering", label: "plans" },
        ]}
      />
    </StoryFrame>
  );
}
