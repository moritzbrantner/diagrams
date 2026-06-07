import { InfoIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import {
  ArchitectureDiagram,
  BurndownChart,
  DecisionTree,
  DependencyGraph,
  EntityRelationshipDiagram,
  GanttChart,
  JourneyMap,
  MindMap,
  OrgChart,
  ProcessMap,
  RelationshipMap,
  SequenceDiagram,
  StateMachineDiagram,
  SwimlaneDiagram,
  TimelineDiagram,
} from "./index";

import type { Meta, StoryObj } from "@storybook/react-vite";

function StoryFrame({ children }: { children?: React.ReactNode }) {
  return <div className="mx-auto grid max-w-5xl gap-6 p-4">{children}</div>;
}

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OrgChartStory: Story = {
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
              {
                id: "design",
                label: "Design systems",
                description: "Maintains primitives",
              },
              {
                id: "platform",
                label: "Frontend platform",
                description: "Validates package consumers",
                children: [
                  {
                    id: "quality",
                    label: "Quality",
                    description: "Runs checks",
                  },
                ],
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

export const ProcessMapStory: Story = {
  name: "Process Map",
  render: () => (
    <StoryFrame>
      <ProcessMap
        steps={[
          {
            id: "discover",
            label: "Discover",
            description: "Map stakeholders and decision points.",
            meta: "Complete",
            status: "done",
            tone: "success",
          },
          {
            id: "shape",
            label: "Shape",
            description: "Turn the diagram into a release plan.",
            meta: "Active",
            status: "active",
            tone: "accent",
          },
          {
            id: "share",
            label: "Share",
            description: "Publish the artifact with context.",
            meta: "Next",
            status: "pending",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("list")).toBeVisible();
    await expect(canvas.getByText("Shape")).toBeVisible();
  },
};

export const RelationshipMapStory: Story = {
  name: "Relationship Map",
  render: () => (
    <StoryFrame>
      <RelationshipMap
        ariaLabel="Story relationship map"
        nodes={[
          {
            id: "product",
            label: "Product",
            description: "Priorities",
            x: 0,
            y: 90,
          },
          {
            id: "design",
            label: "Design",
            description: "Components",
            x: 280,
            y: 0,
            tone: "success",
          },
          {
            id: "engineering",
            label: "Engineering",
            description: "Package",
            x: 280,
            y: 180,
          },
          {
            id: "governance",
            label: "Governance",
            description: "Approval",
            x: 560,
            y: 90,
            tone: "warning",
          },
        ]}
        edges={[
          {
            id: "product-design",
            source: "product",
            target: "design",
            label: "briefs",
          },
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

export const BurndownChartStory: Story = {
  name: "Burndown Chart",
  render: () => (
    <StoryFrame>
      <BurndownChart
        ariaLabel="Story burndown chart"
        points={[
          { id: "day-1", date: "2026-04-01", remaining: 48 },
          { id: "day-3", date: "2026-04-03", remaining: 42 },
          { id: "day-6", date: "2026-04-06", remaining: 31 },
          { id: "day-9", date: "2026-04-09", remaining: 24 },
          { id: "day-12", date: "2026-04-12", remaining: 11 },
          { id: "day-15", date: "2026-04-15", remaining: 4 },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-15"
        totalWork={48}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story burndown chart" })).toBeVisible();
    await expect(canvas.getByText("Remaining")).toBeVisible();
  },
};

export const GanttChartStory: Story = {
  name: "Gantt Chart",
  render: () => (
    <StoryFrame>
      <GanttChart
        ariaLabel="Story Gantt chart"
        tasks={[
          {
            id: "brief",
            label: "Release brief",
            description: "Scope and approval",
            startDate: "2026-04-01",
            endDate: "2026-04-04",
            earliestStartDate: "2026-04-01",
            deadlineDate: "2026-04-05",
            progress: 1,
            tone: "success",
          },
          {
            id: "components",
            label: "Component work",
            description: "Build primitives",
            startDate: "2026-04-04",
            endDate: "2026-04-14",
            earliestStartDate: "2026-04-03",
            deadlineDate: "2026-04-16",
            progress: 0.68,
          },
          {
            id: "validation",
            label: "Validation",
            description: "Tests and docs",
            startDate: "2026-04-15",
            endDate: "2026-04-22",
            earliestStartDate: "2026-04-12",
            deadlineDate: "2026-04-21",
            progress: 0.3,
            tone: "warning",
          },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-24"
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story Gantt chart" })).toBeVisible();
    await expect(canvas.getByText("Component work")).toBeVisible();
    await expect(canvas.getAllByText("Deadline")).toHaveLength(3);
  },
};

export const SequenceDiagramStory: Story = {
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

export const SwimlaneDiagramStory: Story = {
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

export const DependencyGraphStory: Story = {
  name: "Dependency Graph",
  render: () => (
    <StoryFrame>
      <DependencyGraph
        ariaLabel="Story dependency graph"
        showLegend
        nodes={[
          { id: "app", label: "App", x: 0, y: 90 },
          { id: "diagrams", label: "Diagrams", status: "active", x: 280, y: 0 },
          { id: "ui", label: "UI", status: "stable", x: 560, y: 90 },
        ]}
        edges={[
          { id: "app-diagrams", source: "app", target: "diagrams", label: "imports" },
          { id: "diagrams-ui", source: "diagrams", target: "ui", label: "peer", kind: "peer" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story dependency graph" })).toBeVisible();
    await expect(canvas.getByText("Diagrams")).toBeVisible();
  },
};

export const InteractiveDependencyGraphStory: Story = {
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
        parts={[
          {
            id: "runtime",
            label: "Runtime packages",
            nodeIds: ["diagrams", "ui"],
          },
        ]}
        nodeActions={(node) => [
          {
            id: "inspect",
            label: `Inspect ${node.id}`,
            icon: <InfoIcon aria-hidden="true" />,
          },
          {
            id: "delete",
            label: `Delete ${node.id}`,
            destructive: true,
            disabled: node.id === "app",
            icon: <Trash2Icon aria-hidden="true" />,
          },
        ]}
        nodes={[
          { id: "app", label: "App", description: "Consumer app", x: 0, y: 90 },
          {
            id: "diagrams",
            label: "Diagrams",
            description: "Diagram package",
            status: "active",
            x: 280,
            y: 0,
          },
          { id: "ui", label: "UI", description: "Peer package", status: "stable", x: 560, y: 90 },
          {
            id: "docs",
            label: "Docs",
            description: "Examples and API report",
            status: "stable",
            x: 280,
            y: 190,
          },
        ]}
        edges={[
          { id: "app-diagrams", source: "app", target: "diagrams", label: "imports" },
          { id: "diagrams-ui", source: "diagrams", target: "ui", label: "peer", kind: "peer" },
          { id: "diagrams-docs", source: "diagrams", target: "docs", label: "documents" },
        ]}
      />
    </StoryFrame>
  );
}

export const ArchitectureDiagramStory: Story = {
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

export const EntityRelationshipDiagramStory: Story = {
  name: "Entity Relationship Diagram",
  render: () => (
    <StoryFrame>
      <EntityRelationshipDiagram
        ariaLabel="Story entity relationship diagram"
        entities={[
          {
            id: "orders",
            name: "orders",
            fields: [
              { id: "id", name: "id", type: "uuid", key: "primary" },
              { id: "customer_id", name: "customer_id", type: "uuid", key: "foreign" },
            ],
          },
          {
            id: "customers",
            name: "customers",
            x: 340,
            y: 80,
            fields: [{ id: "customer-id", name: "id", type: "uuid", key: "primary" }],
          },
        ]}
        relations={[
          {
            id: "customer-orders",
            source: "customers",
            target: "orders",
            label: "places",
            sourceCardinality: "one",
            targetCardinality: "zero-or-many",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Story entity relationship diagram" }),
    ).toBeVisible();
    await expect(canvas.getByText("customer_id")).toBeVisible();
  },
};

export const DecisionTreeStory: Story = {
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

export const StateMachineDiagramStory: Story = {
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

export const JourneyMapStory: Story = {
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

export const TimelineDiagramStory: Story = {
  name: "Timeline Diagram",
  render: () => (
    <StoryFrame>
      <TimelineDiagram
        ariaLabel="Story timeline diagram"
        items={[
          { id: "scope", date: "2026-04-01", label: "Scope" },
          { id: "beta", date: "2026-04-10", label: "Beta", tone: "accent" },
          { id: "ga", date: "2026-04-24", label: "GA", tone: "success" },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story timeline diagram" })).toBeVisible();
    await expect(canvas.getByText("Beta")).toBeVisible();
  },
};

export const MindMapStory: Story = {
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
