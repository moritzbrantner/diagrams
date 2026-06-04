import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BoxesIcon, GitBranchIcon, NetworkIcon, WorkflowIcon } from "lucide-react";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { OrgChart, ProcessMap, RelationshipMap, UmlDiagram } from "@moritzbrantner/diagrams";

import "./styles.css";

import type React from "react";

const queryClient = new QueryClient();

type DiagramKey = "uml" | "org" | "process" | "relationships";

type ShowcaseData = {
  umlNodes: React.ComponentProps<typeof UmlDiagram>["nodes"];
  umlEdges: React.ComponentProps<typeof UmlDiagram>["edges"];
  processSteps: React.ComponentProps<typeof ProcessMap>["steps"];
  orgNodes: React.ComponentProps<typeof OrgChart>["nodes"];
  relationshipNodes: React.ComponentProps<typeof RelationshipMap>["nodes"];
  relationshipEdges: React.ComponentProps<typeof RelationshipMap>["edges"];
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
];

const snippets: Record<DiagramKey, string> = {
  uml: '<UmlDiagram nodes={serviceNodes} edges={serviceEdges} ariaLabel="Service dependency UML diagram" />',
  org: '<OrgChart nodes={orgNodes} defaultExpandedDepth={2} selectedNodeId="platform" />',
  process:
    '<ProcessMap steps={processSteps} orientation={mode === "compact" ? "vertical" : "horizontal"} />',
  relationships:
    '<RelationshipMap nodes={nodes} edges={edges} ariaLabel="Release relationship map" />',
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
    {
      label: "Diagrams",
      value: diagramTabs.length,
    },
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

    return (
      <RelationshipMap
        ariaLabel="Release relationship map"
        caption="Labeled edges keep dependency intent visible."
        nodes={data.relationshipNodes}
        edges={data.relationshipEdges}
      />
    );
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
      <div className="grid gap-3 sm:grid-cols-4">
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
            diagrams, process maps, org structures, and relationship graphs.
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
