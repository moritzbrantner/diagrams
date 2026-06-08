import { InfoIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import { DependencyGraph } from "../dependency-graph";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

const dependencyNodes = [
  { id: "app", label: "App", x: 0, y: 90 },
  { id: "diagrams", label: "Diagrams", status: "active", x: 280, y: 0 },
  { id: "ui", label: "UI", status: "stable", x: 560, y: 90 },
  { id: "docs", label: "Docs", status: "stable", x: 280, y: 190 },
] satisfies React.ComponentProps<typeof DependencyGraph>["nodes"];

const dependencyEdges = [
  { id: "app-diagrams", source: "app", target: "diagrams", label: "imports" },
  { id: "diagrams-ui", source: "diagrams", target: "ui", label: "peer", kind: "peer" },
  { id: "diagrams-docs", source: "diagrams", target: "docs", label: "documents" },
] satisfies React.ComponentProps<typeof DependencyGraph>["edges"];

export const DependencyGraphStory: ComponentsStory = {
  name: "Dependency Graph",
  render: () => (
    <StoryFrame>
      <DependencyGraph
        ariaLabel="Story dependency graph"
        showLegend
        nodes={dependencyNodes.slice(0, 3)}
        edges={dependencyEdges.slice(0, 2)}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story dependency graph" })).toBeVisible();
    await expect(canvas.getByText("Diagrams")).toBeVisible();
  },
};

export const InteractiveCanvasDependencyGraphStory: ComponentsStory = {
  name: "Interactive Canvas Dependency Graph",
  render: () => (
    <StoryFrame>
      <DependencyGraph
        ariaLabel="Interactive canvas dependency graph"
        interactiveFeatures={true}
        nodes={dependencyNodes}
        edges={dependencyEdges}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Search diagram" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Search diagram" }), "documents");
    await expect(await canvas.findByText("1 / 1")).toBeVisible();
    await expect(await canvas.findByRole("dialog")).toBeVisible();
  },
};

export const InteractiveDependencyGraphStory: ComponentsStory = {
  name: "Interactive Dependency Graph",
  render: () => <InteractiveDependencyGraphDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Expand Runtime packages" }));
    await userEvent.click(canvas.getByText("Diagrams"));
    await expect(canvas.getByRole("button", { name: "Inspect diagrams" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect diagrams" }));
  },
};

function InteractiveDependencyGraphDemo() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("diagrams");
  const [minimizedPartIds, setMinimizedPartIds] = React.useState<string[]>(["runtime"]);
  const [minimizedNodeIds, setMinimizedNodeIds] = React.useState<string[]>([]);

  return (
    <StoryFrame>
      <DependencyGraph
        ariaLabel="Interactive dependency graph"
        enableNodeMinimize
        minimizedNodeIds={minimizedNodeIds}
        minimizedPartIds={minimizedPartIds}
        onMinimizedNodeIdsChange={setMinimizedNodeIds}
        onMinimizedPartIdsChange={setMinimizedPartIds}
        selectedNodeId={selectedNodeId}
        onNodeSelect={(node) => setSelectedNodeId(node.id)}
        onNodeDeselect={() => setSelectedNodeId(null)}
        parts={[{ id: "runtime", label: "Runtime packages", nodeIds: ["diagrams", "ui"] }]}
        nodeActions={(node) => [
          { id: "inspect", label: `Inspect ${node.id}`, icon: <InfoIcon aria-hidden="true" /> },
          {
            id: "delete",
            label: `Delete ${node.id}`,
            destructive: true,
            disabled: node.id === "app",
            icon: <Trash2Icon aria-hidden="true" />,
          },
        ]}
        nodes={dependencyNodes}
        edges={dependencyEdges}
      />
    </StoryFrame>
  );
}
