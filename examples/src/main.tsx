import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BoxesIcon, GitBranchIcon, NetworkIcon, WorkflowIcon } from "lucide-react";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

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
  UmlDiagram,
} from "@moritzbrantner/diagrams";

import "./styles.css";

import type React from "react";

const queryClient = new QueryClient();

type DiagramKey =
  | "uml"
  | "org"
  | "process"
  | "relationships"
  | "burndown"
  | "gantt"
  | "sequence"
  | "swimlane"
  | "dependencies"
  | "architecture"
  | "erd"
  | "decision"
  | "state"
  | "journey"
  | "timeline"
  | "mind";

type ShowcaseData = {
  umlNodes: React.ComponentProps<typeof UmlDiagram>["nodes"];
  umlEdges: React.ComponentProps<typeof UmlDiagram>["edges"];
  processSteps: React.ComponentProps<typeof ProcessMap>["steps"];
  orgNodes: React.ComponentProps<typeof OrgChart>["nodes"];
  relationshipNodes: React.ComponentProps<typeof RelationshipMap>["nodes"];
  relationshipEdges: React.ComponentProps<typeof RelationshipMap>["edges"];
  burndownPoints: React.ComponentProps<typeof BurndownChart>["points"];
  ganttTasks: React.ComponentProps<typeof GanttChart>["tasks"];
  sequenceParticipants: React.ComponentProps<typeof SequenceDiagram>["participants"];
  sequenceMessages: React.ComponentProps<typeof SequenceDiagram>["messages"];
  swimlaneLanes: React.ComponentProps<typeof SwimlaneDiagram>["lanes"];
  swimlaneSteps: React.ComponentProps<typeof SwimlaneDiagram>["steps"];
  swimlaneConnectors: React.ComponentProps<typeof SwimlaneDiagram>["connectors"];
  dependencyNodes: React.ComponentProps<typeof DependencyGraph>["nodes"];
  dependencyEdges: React.ComponentProps<typeof DependencyGraph>["edges"];
  architectureNodes: React.ComponentProps<typeof ArchitectureDiagram>["nodes"];
  architectureConnections: React.ComponentProps<typeof ArchitectureDiagram>["connections"];
  architectureBoundaries: React.ComponentProps<typeof ArchitectureDiagram>["boundaries"];
  erdEntities: React.ComponentProps<typeof EntityRelationshipDiagram>["entities"];
  erdRelations: React.ComponentProps<typeof EntityRelationshipDiagram>["relations"];
  decisionRoot: React.ComponentProps<typeof DecisionTree>["root"];
  stateMachineStates: React.ComponentProps<typeof StateMachineDiagram>["states"];
  stateMachineTransitions: React.ComponentProps<typeof StateMachineDiagram>["transitions"];
  journeyPhases: React.ComponentProps<typeof JourneyMap>["phases"];
  journeyTouchpoints: React.ComponentProps<typeof JourneyMap>["touchpoints"];
  timelineItems: React.ComponentProps<typeof TimelineDiagram>["items"];
  mindMapRoot: React.ComponentProps<typeof MindMap>["root"];
};

const diagramTabs: {
  key: DiagramKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "uml", label: "UML", icon: BoxesIcon },
  { key: "org", label: "Org", icon: GitBranchIcon },
  { key: "process", label: "Process", icon: WorkflowIcon },
  { key: "relationships", label: "Map", icon: NetworkIcon },
  { key: "burndown", label: "Burndown", icon: WorkflowIcon },
  { key: "gantt", label: "Gantt", icon: GitBranchIcon },
  { key: "sequence", label: "Sequence", icon: WorkflowIcon },
  { key: "swimlane", label: "Swimlane", icon: WorkflowIcon },
  { key: "dependencies", label: "Deps", icon: NetworkIcon },
  { key: "architecture", label: "Arch", icon: BoxesIcon },
  { key: "erd", label: "ERD", icon: BoxesIcon },
  { key: "decision", label: "Decision", icon: GitBranchIcon },
  { key: "state", label: "State", icon: WorkflowIcon },
  { key: "journey", label: "Journey", icon: WorkflowIcon },
  { key: "timeline", label: "Timeline", icon: WorkflowIcon },
  { key: "mind", label: "Mind", icon: NetworkIcon },
];

const snippets: Record<DiagramKey, string> = {
  uml: '<UmlDiagram nodes={serviceNodes} edges={serviceEdges} ariaLabel="Service dependency UML diagram" />',
  org: '<OrgChart nodes={orgNodes} defaultExpandedDepth={2} selectedNodeId="platform" />',
  process:
    '<ProcessMap steps={processSteps} orientation={mode === "compact" ? "vertical" : "horizontal"} />',
  relationships:
    '<RelationshipMap nodes={nodes} edges={edges} ariaLabel="Release relationship map" />',
  burndown:
    '<BurndownChart points={burndownPoints} startDate="2026-04-01" endDate="2026-04-15" totalWork={48} />',
  gantt: '<GanttChart tasks={ganttTasks} startDate="2026-04-01" endDate="2026-04-24" />',
  sequence: "<SequenceDiagram participants={participants} messages={messages} />",
  swimlane: "<SwimlaneDiagram lanes={lanes} steps={steps} connectors={connectors} />",
  dependencies: "<DependencyGraph nodes={nodes} edges={edges} showLegend />",
  architecture:
    "<ArchitectureDiagram nodes={nodes} connections={connections} boundaries={boundaries} />",
  erd: "<EntityRelationshipDiagram entities={entities} relations={relations} />",
  decision: "<DecisionTree root={decisionRoot} />",
  state: "<StateMachineDiagram states={states} transitions={transitions} />",
  journey: "<JourneyMap phases={phases} touchpoints={touchpoints} />",
  timeline: "<TimelineDiagram items={items} />",
  mind: "<MindMap root={mindMapRoot} />",
};

async function loadShowcaseData(): Promise<ShowcaseData> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  return {
    umlNodes: [
      {
        id: "api",
        label: "API Gateway",
        description: "Routes authenticated requests.",
        x: 0,
        y: 0,
      },
      {
        id: "orders",
        label: "Orders Service",
        description: "Owns lifecycle commands and state.",
        variant: "accent",
        x: 292,
        y: 0,
      },
      {
        id: "billing",
        label: "Billing Adapter",
        description: "Maps domain requests onto provider APIs.",
        variant: "muted",
        x: 584,
        y: 0,
      },
      {
        id: "events",
        label: "Event Stream",
        description: "Publishes lifecycle changes.",
        variant: "warning",
        x: 292,
        y: 192,
      },
    ],
    umlEdges: [
      {
        id: "api-orders",
        source: "api",
        target: "orders",
        label: "command",
        direction: "forward",
      },
      {
        id: "orders-billing",
        source: "orders",
        target: "billing",
        label: "authorizes",
        kind: "dependency",
        direction: "forward",
      },
      {
        id: "orders-events",
        source: "orders",
        target: "events",
        label: "publishes",
        direction: "forward",
      },
    ],
    processSteps: [
      {
        id: "discover",
        label: "Discover",
        description: "Map stakeholders and decision points.",
        meta: "Complete",
        status: "done",
        tone: "success",
        icon: BoxesIcon,
      },
      {
        id: "shape",
        label: "Shape",
        description: "Turn the diagram into a release plan.",
        meta: "Active",
        status: "active",
        tone: "accent",
        icon: WorkflowIcon,
      },
      {
        id: "share",
        label: "Share",
        description: "Publish the artifact with context.",
        meta: "Next",
        status: "pending",
        icon: NetworkIcon,
      },
    ],
    orgNodes: [
      {
        id: "owner",
        label: "Program owner",
        description: "Sets release scope",
        meta: "Accountable",
        children: [
          {
            id: "design",
            label: "Design systems",
            description: "Maintains primitives",
            meta: "Consulted",
          },
          {
            id: "platform",
            label: "Frontend platform",
            description: "Validates package consumers",
            meta: "Responsible",
            children: [
              {
                id: "quality",
                label: "Quality",
                description: "Runs checks",
                meta: "Informed",
              },
            ],
          },
        ],
      },
    ],
    relationshipNodes: [
      {
        id: "product",
        label: "Product",
        description: "Priorities",
        group: "Input",
        x: 0,
        y: 90,
      },
      {
        id: "design",
        label: "Design",
        description: "Components",
        group: "System",
        x: 280,
        y: 0,
        tone: "success",
      },
      {
        id: "engineering",
        label: "Engineering",
        description: "Package",
        group: "System",
        x: 280,
        y: 180,
      },
      {
        id: "governance",
        label: "Governance",
        description: "Approval",
        group: "Control",
        x: 560,
        y: 90,
        tone: "warning",
      },
    ],
    relationshipEdges: [
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
    ],
    burndownPoints: [
      { id: "day-1", date: "2026-04-01", remaining: 48 },
      { id: "day-3", date: "2026-04-03", remaining: 42 },
      { id: "day-6", date: "2026-04-06", remaining: 31 },
      { id: "day-9", date: "2026-04-09", remaining: 24 },
      { id: "day-12", date: "2026-04-12", remaining: 11 },
      { id: "day-15", date: "2026-04-15", remaining: 4 },
    ],
    ganttTasks: [
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
        description: "Build diagram primitives",
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
    ],
    sequenceParticipants: [
      { id: "client", label: "Client", description: "Browser" },
      { id: "api", label: "API", description: "Gateway", tone: "accent" },
      { id: "orders", label: "Orders", description: "Domain service" },
    ],
    sequenceMessages: [
      { id: "request", from: "client", to: "api", label: "POST /orders" },
      { id: "command", from: "api", to: "orders", label: "Create order", kind: "async" },
      { id: "result", from: "orders", to: "api", label: "Accepted", kind: "return" },
    ],
    swimlaneLanes: [
      { id: "product", label: "Product", description: "Defines intent" },
      { id: "engineering", label: "Engineering", description: "Ships package" },
      { id: "quality", label: "Quality", description: "Checks release" },
    ],
    swimlaneSteps: [
      { id: "brief-step", laneId: "product", label: "Brief", status: "done", tone: "success" },
      { id: "build-step", laneId: "engineering", label: "Build", status: "active", tone: "accent" },
      { id: "test-step", laneId: "quality", label: "Validate", status: "warning", tone: "warning" },
    ],
    swimlaneConnectors: [
      { id: "brief-build", source: "brief-step", target: "build-step", label: "hands off" },
      {
        id: "build-test",
        source: "build-step",
        target: "test-step",
        label: "candidate",
        kind: "risk",
      },
    ],
    dependencyNodes: [
      { id: "app", label: "App", group: "Consumer", status: "active", x: 0, y: 90 },
      {
        id: "diagrams",
        label: "Diagrams",
        group: "Package",
        version: "0.1",
        status: "stable",
        x: 280,
        y: 0,
      },
      { id: "ui", label: "UI", group: "Peer", version: "0.9", status: "stable", x: 560, y: 90 },
      {
        id: "react",
        label: "React",
        group: "Peer",
        version: "19",
        status: "stable",
        x: 280,
        y: 180,
      },
    ],
    dependencyEdges: [
      { id: "app-diagrams", source: "app", target: "diagrams", label: "imports", kind: "runtime" },
      { id: "diagrams-ui", source: "diagrams", target: "ui", label: "styles", kind: "peer" },
      { id: "diagrams-react", source: "diagrams", target: "react", label: "renders", kind: "peer" },
    ],
    architectureBoundaries: [
      { id: "platform", label: "Platform" },
      { id: "external", label: "External", x: 560, y: -44, width: 236, height: 300 },
    ],
    architectureNodes: [
      { id: "gateway", label: "Gateway", kind: "gateway", boundaryId: "platform", x: 0, y: 40 },
      {
        id: "orders-arch",
        label: "Orders",
        kind: "service",
        boundaryId: "platform",
        x: 260,
        y: 40,
        tone: "accent",
      },
      { id: "db", label: "Orders DB", kind: "database", boundaryId: "platform", x: 260, y: 190 },
      {
        id: "payments",
        label: "Payments",
        kind: "external",
        boundaryId: "external",
        x: 600,
        y: 100,
      },
    ],
    architectureConnections: [
      {
        id: "gateway-orders",
        source: "gateway",
        target: "orders-arch",
        label: "command",
        protocol: "HTTPS",
      },
      { id: "orders-db", source: "orders-arch", target: "db", label: "writes", kind: "data" },
      {
        id: "orders-payments",
        source: "orders-arch",
        target: "payments",
        label: "authorize",
        kind: "risk",
      },
    ],
    erdEntities: [
      {
        id: "orders-table",
        name: "orders",
        fields: [
          { id: "order-id", name: "id", type: "uuid", key: "primary" },
          { id: "customer-id", name: "customer_id", type: "uuid", key: "foreign" },
          { id: "status", name: "status", type: "text" },
        ],
      },
      {
        id: "customers-table",
        name: "customers",
        x: 340,
        y: 80,
        fields: [
          { id: "customer-id-pk", name: "id", type: "uuid", key: "primary" },
          { id: "email", name: "email", type: "text", key: "unique" },
        ],
      },
    ],
    erdRelations: [
      {
        id: "customers-orders",
        source: "customers-table",
        target: "orders-table",
        label: "places",
        sourceCardinality: "one",
        targetCardinality: "zero-or-many",
        identifying: true,
      },
    ],
    decisionRoot: {
      id: "release-ready",
      label: "Release ready?",
      children: [
        {
          id: "yes-path",
          label: "Yes",
          target: { id: "ship", label: "Ship package", kind: "outcome", tone: "success" },
          tone: "success",
        },
        {
          id: "no-path",
          label: "No",
          target: { id: "fix", label: "Fix blockers", kind: "action", tone: "warning" },
          tone: "warning",
        },
      ],
    },
    stateMachineStates: [
      { id: "initial", label: "Initial", kind: "initial", x: 0, y: 24 },
      { id: "draft", label: "Draft", x: 150, y: 0 },
      { id: "review", label: "Review", x: 420, y: 0, tone: "accent" },
      { id: "released", label: "Released", kind: "final", x: 700, y: 24 },
    ],
    stateMachineTransitions: [
      { id: "start-draft", source: "initial", target: "draft", event: "create" },
      { id: "draft-review", source: "draft", target: "review", event: "submit" },
      { id: "review-released", source: "review", target: "released", event: "approve" },
    ],
    journeyPhases: [
      { id: "discover-phase", label: "Discover", description: "Find the package" },
      { id: "adopt-phase", label: "Adopt", description: "Wire examples", tone: "accent" },
      { id: "ship-phase", label: "Ship", description: "Publish release" },
    ],
    journeyTouchpoints: [
      {
        id: "docs-touch",
        phaseId: "discover-phase",
        label: "Read docs",
        sentiment: "positive",
        owner: "Developer",
      },
      {
        id: "api-touch",
        phaseId: "adopt-phase",
        label: "Model data",
        sentiment: "neutral",
        owner: "Developer",
      },
      {
        id: "verify-touch",
        phaseId: "ship-phase",
        label: "Run verify",
        sentiment: "positive",
        owner: "Maintainer",
      },
    ],
    timelineItems: [
      { id: "scope-time", date: "2026-04-01", label: "Scope", kind: "milestone" },
      { id: "beta-time", date: "2026-04-10", label: "Beta", kind: "release", tone: "accent" },
      { id: "ga-time", date: "2026-04-24", label: "GA", kind: "deadline", tone: "success" },
    ],
    mindMapRoot: {
      id: "diagrams-root",
      label: "Diagrams",
      tone: "accent",
      children: [
        { id: "structure-mind", label: "Structure" },
        { id: "workflow-mind", label: "Workflow" },
        { id: "planning-mind", label: "Planning" },
        { id: "systems-mind", label: "Systems" },
      ],
    },
  };
}

function ExampleSection({
  children,
  title,
  testId,
}: {
  children: React.ReactNode;
  title: string;
  testId: string;
}) {
  return (
    <section data-testid={testId} className="grid min-w-0 gap-4 border-t py-8 first:border-t-0">
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

function ShowcaseButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function InsightStrip({ data }: { data: ShowcaseData }) {
  const stats = [
    { label: "Diagrams", value: diagramTabs.length },
    {
      label: "Steps",
      value: data.processSteps?.length ?? 0,
    },
    {
      label: "Nodes",
      value: data.umlNodes.length + data.relationshipNodes.length + (data.orgNodes?.length ?? 0),
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-md border bg-card px-4 py-3 text-card-foreground">
          <dt className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-normal">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SnippetPanel({ activeDiagram }: { activeDiagram: DiagramKey }) {
  return (
    <div className="grid min-w-0 content-start gap-3 rounded-md border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2">
        <BoxesIcon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-normal">API shape</h2>
      </div>
      <pre className="min-w-0 whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
        <code>{snippets[activeDiagram]}</code>
      </pre>
    </div>
  );
}

function ShowcasePreview({
  activeDiagram,
  data,
}: {
  activeDiagram: DiagramKey;
  data: ShowcaseData;
}) {
  const preview = useMemo(() => {
    if (activeDiagram === "uml") {
      return (
        <UmlDiagram
          ariaLabel="Service dependency UML diagram"
          caption="Directed dependencies make service boundaries explicit."
          nodes={data.umlNodes}
          edges={data.umlEdges}
        />
      );
    }

    if (activeDiagram === "org") {
      return <OrgChart nodes={data.orgNodes} defaultExpandedDepth={2} selectedNodeId="platform" />;
    }

    if (activeDiagram === "process") {
      return <ProcessMap steps={data.processSteps} />;
    }

    if (activeDiagram === "relationships") {
      return (
        <RelationshipMap
          ariaLabel="Release relationship map"
          caption="Labeled edges keep dependency intent visible."
          nodes={data.relationshipNodes}
          edges={data.relationshipEdges}
        />
      );
    }

    if (activeDiagram === "burndown") {
      return (
        <BurndownChart
          ariaLabel="Release burndown chart"
          caption="Remaining work is shown against the ideal completion path."
          points={data.burndownPoints}
          startDate="2026-04-01"
          endDate="2026-04-15"
          totalWork={48}
        />
      );
    }

    if (activeDiagram === "gantt") {
      return (
        <GanttChart
          ariaLabel="Release Gantt chart"
          caption="Earliest starts and deadlines are marked per task."
          tasks={data.ganttTasks}
          startDate="2026-04-01"
          endDate="2026-04-24"
        />
      );
    }

    if (activeDiagram === "sequence") {
      return (
        <SequenceDiagram
          ariaLabel="Release sequence diagram"
          participants={data.sequenceParticipants}
          messages={data.sequenceMessages}
        />
      );
    }

    if (activeDiagram === "swimlane") {
      return (
        <SwimlaneDiagram
          ariaLabel="Release swimlane diagram"
          lanes={data.swimlaneLanes}
          steps={data.swimlaneSteps}
          connectors={data.swimlaneConnectors}
        />
      );
    }

    if (activeDiagram === "dependencies") {
      return (
        <DependencyGraph
          ariaLabel="Package dependency graph"
          nodes={data.dependencyNodes}
          edges={data.dependencyEdges}
          showLegend
        />
      );
    }

    if (activeDiagram === "architecture") {
      return (
        <ArchitectureDiagram
          ariaLabel="Service architecture diagram"
          nodes={data.architectureNodes}
          connections={data.architectureConnections}
          boundaries={data.architectureBoundaries}
        />
      );
    }

    if (activeDiagram === "erd") {
      return (
        <EntityRelationshipDiagram
          ariaLabel="Order entity relationship diagram"
          entities={data.erdEntities}
          relations={data.erdRelations}
        />
      );
    }

    if (activeDiagram === "decision") {
      return <DecisionTree ariaLabel="Release decision tree" root={data.decisionRoot} />;
    }

    if (activeDiagram === "state") {
      return (
        <StateMachineDiagram
          ariaLabel="Release state machine diagram"
          states={data.stateMachineStates}
          transitions={data.stateMachineTransitions}
        />
      );
    }

    if (activeDiagram === "journey") {
      return (
        <JourneyMap
          ariaLabel="Adoption journey map"
          phases={data.journeyPhases}
          touchpoints={data.journeyTouchpoints}
        />
      );
    }

    if (activeDiagram === "timeline") {
      return <TimelineDiagram ariaLabel="Release timeline diagram" items={data.timelineItems} />;
    }

    return <MindMap ariaLabel="Diagram mind map" root={data.mindMapRoot} />;
  }, [activeDiagram, data]);

  return (
    <div className="grid min-w-0 gap-4 rounded-md border bg-card p-4 text-card-foreground">
      {preview}
    </div>
  );
}

function ShowcaseApp({ data }: { data: ShowcaseData }) {
  const [activeDiagram, setActiveDiagram] = useState<DiagramKey>("uml");

  return (
    <section className="grid min-w-0 gap-4 py-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {diagramTabs.map((tab) => (
          <ShowcaseButton
            key={tab.key}
            active={activeDiagram === tab.key}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveDiagram(tab.key)}
          />
        ))}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ShowcasePreview activeDiagram={activeDiagram} data={data} />
        <SnippetPanel activeDiagram={activeDiagram} />
      </div>
    </section>
  );
}

function ExamplesGallery({ data }: { data: ShowcaseData }) {
  return (
    <>
      <ExampleSection title="UML dependency diagram" testId="uml-diagram-example">
        <UmlDiagram
          ariaLabel="Service dependency UML diagram"
          nodes={data.umlNodes}
          edges={data.umlEdges}
        />
      </ExampleSection>

      <ExampleSection title="Organization chart" testId="org-chart-example">
        <OrgChart nodes={data.orgNodes} defaultExpandedDepth={2} />
      </ExampleSection>

      <ExampleSection title="Process map" testId="process-map-example">
        <ProcessMap steps={data.processSteps} />
      </ExampleSection>

      <ExampleSection title="Relationship map" testId="relationship-map-example">
        <RelationshipMap
          ariaLabel="Release relationship map"
          nodes={data.relationshipNodes}
          edges={data.relationshipEdges}
        />
      </ExampleSection>

      <ExampleSection title="Burndown chart" testId="burndown-chart-example">
        <BurndownChart
          ariaLabel="Release burndown chart"
          points={data.burndownPoints}
          startDate="2026-04-01"
          endDate="2026-04-15"
          totalWork={48}
        />
      </ExampleSection>

      <ExampleSection title="Gantt chart" testId="gantt-chart-example">
        <GanttChart
          ariaLabel="Release Gantt chart"
          tasks={data.ganttTasks}
          startDate="2026-04-01"
          endDate="2026-04-24"
        />
      </ExampleSection>

      <ExampleSection title="Sequence diagram" testId="sequence-diagram-example">
        <SequenceDiagram
          ariaLabel="Release sequence diagram"
          participants={data.sequenceParticipants}
          messages={data.sequenceMessages}
        />
      </ExampleSection>

      <ExampleSection title="Swimlane diagram" testId="swimlane-diagram-example">
        <SwimlaneDiagram
          ariaLabel="Release swimlane diagram"
          lanes={data.swimlaneLanes}
          steps={data.swimlaneSteps}
          connectors={data.swimlaneConnectors}
        />
      </ExampleSection>

      <ExampleSection title="Dependency graph" testId="dependency-graph-example">
        <DependencyGraph
          ariaLabel="Package dependency graph"
          nodes={data.dependencyNodes}
          edges={data.dependencyEdges}
          showLegend
        />
      </ExampleSection>

      <ExampleSection title="Architecture diagram" testId="architecture-diagram-example">
        <ArchitectureDiagram
          ariaLabel="Service architecture diagram"
          nodes={data.architectureNodes}
          connections={data.architectureConnections}
          boundaries={data.architectureBoundaries}
        />
      </ExampleSection>

      <ExampleSection
        title="Entity relationship diagram"
        testId="entity-relationship-diagram-example"
      >
        <EntityRelationshipDiagram
          ariaLabel="Order entity relationship diagram"
          entities={data.erdEntities}
          relations={data.erdRelations}
        />
      </ExampleSection>

      <ExampleSection title="Decision tree" testId="decision-tree-example">
        <DecisionTree ariaLabel="Release decision tree" root={data.decisionRoot} />
      </ExampleSection>

      <ExampleSection title="State machine diagram" testId="state-machine-diagram-example">
        <StateMachineDiagram
          ariaLabel="Release state machine diagram"
          states={data.stateMachineStates}
          transitions={data.stateMachineTransitions}
        />
      </ExampleSection>

      <ExampleSection title="Journey map" testId="journey-map-example">
        <JourneyMap
          ariaLabel="Adoption journey map"
          phases={data.journeyPhases}
          touchpoints={data.journeyTouchpoints}
        />
      </ExampleSection>

      <ExampleSection title="Timeline diagram" testId="timeline-diagram-example">
        <TimelineDiagram ariaLabel="Release timeline diagram" items={data.timelineItems} />
      </ExampleSection>

      <ExampleSection title="Mind map" testId="mind-map-example">
        <MindMap ariaLabel="Diagram mind map" root={data.mindMapRoot} />
      </ExampleSection>
    </>
  );
}

function AppContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["diagram-showcase"],
    queryFn: loadShowcaseData,
  });

  if (isLoading || !data) {
    return (
      <main className="mx-auto grid min-h-screen max-w-6xl place-items-center px-4 text-foreground">
        <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
          Loading diagram examples
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-foreground">
      <header className="grid gap-4 pb-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">@moritzbrantner/diagrams</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            React 19 diagram primitives with Tailwind styles, React Query data orchestration, UML
            diagrams, process maps, org structures, planning charts, and relationship graphs.
          </p>
        </div>
        <InsightStrip data={data} />
      </header>

      <ShowcaseApp data={data} />
      <ExamplesGallery data={data} />
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
