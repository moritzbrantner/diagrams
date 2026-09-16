export type DiagramPage = {
  slug: string;
  label: string;
  title: string;
  description: string;
  ariaLabel: string;
  snippet: string;
};

export const diagramPages = [
  {
    slug: "architecture-diagram",
    label: "Architecture Diagram",
    title: "Architecture diagram",
    description:
      "Explore service boundaries and pin downstream blast-radius paths through runtime connections.",
    ariaLabel: "Service architecture diagram",
    snippet:
      '<ArchitectureDiagram interactiveFeatures={{ pathHighlight: { mode: "outgoing" } }} highlightedElement={spotlight} onNodeSelect={selectNode} />',
  },
  {
    slug: "decision-tree",
    label: "Decision Tree",
    title: "Decision tree",
    description: "Walk branching decisions and trace the selected reasoning path back to its root.",
    ariaLabel: "Release decision tree",
    snippet:
      '<DecisionTree root={root} interactiveFeatures={{ pathHighlight: { mode: "incoming" } }} highlightedElement={routeEnd} onBranchSelect={chooseBranch} />',
  },
  {
    slug: "dependency-graph",
    label: "Dependency Graph",
    title: "Dependency graph",
    description: "Visualize package, runtime, and peer dependency relationships with a legend.",
    ariaLabel: "Package dependency graph",
    snippet: "<DependencyGraph nodes={nodes} edges={edges} showLegend />",
  },
  {
    slug: "entity-relationship-diagram",
    label: "Entity Relationship Diagram",
    title: "Entity relationship diagram",
    description: "Describe entities, fields, keys, and cardinality between domain tables.",
    ariaLabel: "Order entity relationship diagram",
    snippet: "<EntityRelationshipDiagram entities={entities} relations={relations} />",
  },
  {
    slug: "gantt-chart",
    label: "Gantt Chart",
    title: "Gantt chart",
    description: "Track release work across dates with progress, earliest starts, and deadlines.",
    ariaLabel: "Release Gantt chart",
    snippet: '<GanttChart tasks={tasks} startDate="2026-04-01" endDate="2026-04-24" />',
  },
  {
    slug: "journey-map",
    label: "Journey Map",
    title: "Journey map",
    description: "Map user touchpoints by phase with sentiment and ownership signals.",
    ariaLabel: "Adoption journey map",
    snippet: "<JourneyMap phases={phases} touchpoints={touchpoints} />",
  },
  {
    slug: "mind-map",
    label: "Mind Map",
    title: "Mind map",
    description: "Organize nested concepts around a central topic with radial branches.",
    ariaLabel: "Diagram mind map",
    snippet: "<MindMap root={root} />",
  },
  {
    slug: "org-chart",
    label: "Org Chart",
    title: "Organization chart",
    description: "Render hierarchical ownership, responsibility, and team structure.",
    ariaLabel: "Program organization chart",
    snippet: '<OrgChart nodes={nodes} defaultExpandedDepth={2} selectedNodeId="platform" />',
  },
  {
    slug: "process-map",
    label: "Process Map",
    title: "Process map",
    description: "Show ordered workflow steps with status, tone, metadata, and descriptions.",
    ariaLabel: "Release process map",
    snippet: "<ProcessMap steps={steps} />",
  },
  {
    slug: "relationship-map",
    label: "Relationship Map",
    title: "Relationship map",
    description: "Connect teams, systems, and control points with labeled directional edges.",
    ariaLabel: "Release relationship map",
    snippet: "<RelationshipMap nodes={nodes} edges={edges} />",
  },
  {
    slug: "sequence-diagram",
    label: "Sequence Diagram",
    title: "Sequence diagram",
    description: "Play a request trace message by message while retaining direct message selection.",
    ariaLabel: "Release sequence diagram",
    snippet:
      "<SequenceDiagram participants={participants} messages={messages} highlightedElement={playhead} onMessageSelect={jumpToMessage} />",
  },
  {
    slug: "state-machine-diagram",
    label: "State Machine Diagram",
    title: "State machine diagram",
    description: "Describe states, transitions, events, and final release flow.",
    ariaLabel: "Release state machine diagram",
    snippet: "<StateMachineDiagram states={states} transitions={transitions} />",
  },
  {
    slug: "swimlane-diagram",
    label: "Swimlane Diagram",
    title: "Swimlane diagram",
    description: "Separate workflow responsibilities by lane with cross-lane connectors.",
    ariaLabel: "Release swimlane diagram",
    snippet: "<SwimlaneDiagram lanes={lanes} steps={steps} connectors={connectors} />",
  },
  {
    slug: "timeline-diagram",
    label: "Timeline Diagram",
    title: "Timeline diagram",
    description: "Place milestones, releases, and deadlines along a dated timeline.",
    ariaLabel: "Release timeline diagram",
    snippet: "<TimelineDiagram items={items} />",
  },
  {
    slug: "uml-diagram",
    label: "UML Diagram",
    title: "UML dependency diagram",
    description: "Represent service dependencies with nodes, labels, variants, and directed edges.",
    ariaLabel: "Service dependency UML diagram",
    snippet:
      '<UmlDiagram nodes={nodes} edges={edges} ariaLabel="Service dependency UML diagram" />',
  },
] as const satisfies DiagramPage[];
