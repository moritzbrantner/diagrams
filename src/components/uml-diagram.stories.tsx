import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { expect, userEvent } from "storybook/test";

import {
  UmlClassDiagram,
  UmlDiagram,
  UmlStateDiagram,
  type UmlClass,
  type UmlClassRelationship,
  type UmlDiagramEdge,
  type UmlDiagramNode,
  type UmlState,
  type UmlStateTransition,
} from "./uml-diagram";

import type { Meta, StoryObj } from "@storybook/react-vite";

const classNodes = [
  {
    id: "order",
    name: "Order",
    attributes: ["+ id: UUID", "- status: OrderStatus", "- total: Money"],
    operations: ["+ submit(): void", "+ cancel(reason): void"],
    x: 0,
    y: 72,
  },
  {
    id: "line-item",
    name: "LineItem",
    attributes: ["+ sku: string", "+ quantity: number"],
    operations: ["+ subtotal(): Money"],
    x: 328,
    y: 72,
  },
  {
    id: "payable",
    name: "Payable",
    kind: "interface",
    operations: ["+ authorize(): Receipt"],
    x: 0,
    y: 340,
  },
  {
    id: "payment",
    name: "Payment",
    attributes: ["- provider: Provider", "- capturedAt: Date | null"],
    operations: ["+ capture(): void", "+ refund(): void"],
    x: 328,
    y: 340,
  },
] satisfies UmlClass[];

const classRelationships = [
  {
    id: "order-items",
    source: "order",
    target: "line-item",
    kind: "composition",
    sourceLabel: "1",
    targetLabel: "1..*",
  },
  {
    id: "order-payable",
    source: "order",
    target: "payable",
    kind: "realization",
  },
  {
    id: "payment-order",
    source: "payment",
    target: "order",
    kind: "association",
    direction: "forward",
    targetLabel: "1",
  },
] satisfies UmlClassRelationship[];

const stateNodes = [
  { id: "initial", kind: "initial", x: 0, y: 86 },
  {
    id: "draft",
    label: "Draft",
    activities: ["entry / createCart()", "do / collectItems()"],
    x: 92,
    y: 40,
  },
  {
    id: "submitted",
    label: "Submitted",
    activities: ["entry / reserveInventory()", "do / authorizePayment()"],
    x: 360,
    y: 40,
  },
  { id: "decision", kind: "choice", x: 640, y: 82 },
  {
    id: "fulfilled",
    label: "Fulfilled",
    activities: ["entry / capturePayment()", "exit / notifyCustomer()"],
    x: 760,
    y: 40,
  },
  { id: "final", kind: "final", x: 1032, y: 86 },
] satisfies UmlState[];

const stateTransitions = [
  { id: "start", source: "initial", target: "draft" },
  { id: "submit", source: "draft", target: "submitted", label: "submit" },
  { id: "review", source: "submitted", target: "decision", label: "authorized?" },
  { id: "approved", source: "decision", target: "fulfilled", label: "[yes]" },
  {
    id: "retry",
    source: "decision",
    target: "draft",
    label: "[no]",
    points: [
      { x: 658, y: 236 },
      { x: 188, y: 236 },
    ],
  },
  { id: "finish", source: "fulfilled", target: "final", label: "ship" },
] satisfies UmlStateTransition[];

const serviceNodes = [
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
] satisfies UmlDiagramNode[];

const serviceEdges = [
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
    label: "port",
    kind: "dependency",
  },
] satisfies UmlDiagramEdge[];

function EditableServiceMapDemo() {
  const [nodes, setNodes] = React.useState<UmlDiagramNode[]>(serviceNodes);
  const [edges, setEdges] = React.useState<UmlDiagramEdge[]>(serviceEdges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("orders");
  const nextNodeId = React.useRef(1);

  return (
    <UmlDiagram
      ariaLabel="Editable service dependency diagram"
      nodes={nodes}
      edges={edges}
      selectedNodeId={selectedNodeId}
      onNodeSelect={(node) => setSelectedNodeId(node.id)}
      onNodeDeselect={() => setSelectedNodeId(null)}
      nodeActions={(node) => [
        {
          id: "add",
          label: "Add node",
          icon: <PlusIcon aria-hidden="true" />,
          onSelect: () => {
            const id = `service-${nextNodeId.current++}`;
            const newNode: UmlDiagramNode = {
              id,
              label: `Service ${nextNodeId.current - 1}`,
              description: "Draft dependency",
              x: node.x,
              y: node.y + node.height + 92,
              variant: "accent",
            };

            setNodes((currentNodes) => [...currentNodes, newNode]);
            setEdges((currentEdges) => [
              ...currentEdges,
              {
                id: `${node.id}-${id}`,
                source: node.id,
                target: id,
                kind: "dependency",
                label: "uses",
              },
            ]);
            setSelectedNodeId(id);
          },
        },
        {
          id: "delete",
          label: "Delete node",
          icon: <Trash2Icon aria-hidden="true" />,
          destructive: true,
          disabled: nodes.length <= 1,
          onSelect: () => {
            setNodes((currentNodes) => currentNodes.filter((item) => item.id !== node.id));
            setEdges((currentEdges) =>
              currentEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id),
            );
            setSelectedNodeId((currentSelectedNodeId) =>
              currentSelectedNodeId === node.id ? null : currentSelectedNodeId,
            );
          },
        },
      ]}
      caption="Draft service map with editable dependencies."
    />
  );
}

function UmlDiagramPreview() {
  return (
    <div className="grid max-w-5xl gap-8">
      <UmlClassDiagram
        ariaLabel="Order domain class diagram"
        classes={classNodes}
        relationships={classRelationships}
        caption="Class relationships with composition, realization, association, and multiplicity labels."
      />
      <UmlStateDiagram
        ariaLabel="Order lifecycle state diagram"
        states={stateNodes}
        transitions={stateTransitions}
        caption="State machine display with initial, choice, retry, and final states."
      />
      <UmlDiagram
        ariaLabel="Service dependency diagram"
        nodes={serviceNodes}
        edges={serviceEdges}
        caption="Generic UML-style graph for components, deployments, or package diagrams."
      />
    </div>
  );
}

const meta = {
  title: "Diagrams/UML Diagram",
  component: UmlDiagramPreview,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof UmlDiagramPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

function getUmlDiagramStoryNode(
  canvas: Parameters<NonNullable<Story["play"]>>[0]["canvas"],
  name: string,
) {
  const node = canvas
    .getByText(name)
    .closest<SVGGElement>('[data-slot="uml-diagram-node-interaction"]');

  if (!node) {
    throw new Error(`Could not find UML diagram node ${name}`);
  }

  return node;
}

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Order domain class diagram" })).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Order lifecycle state diagram" })).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Service dependency diagram" })).toBeVisible();
    await expect(canvas.getByText("Order")).toBeVisible();
    await expect(canvas.getByText("Fulfilled")).toBeVisible();
    await expect(canvas.getByText("Billing Adapter")).toBeVisible();
  },
};

export const EditableServiceMap: Story = {
  render: () => <EditableServiceMapDemo />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("group", { name: "Editable service dependency diagram" }),
    ).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: "Add node" })[1]);
    await expect(canvas.getByText("Service 1")).toBeVisible();
    const deleteButtons = canvas.getAllByRole("button", { name: "Delete node" });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    await expect(canvas.queryByText("Service 1")).not.toBeInTheDocument();
  },
};

export const KeyboardNodeSelection: Story = {
  render: () => <KeyboardNodeSelectionDemo />,
  play: async ({ canvas }) => {
    const orders = getUmlDiagramStoryNode(canvas, "Orders Service");

    orders.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(getUmlDiagramStoryNode(canvas, "API Gateway")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(getUmlDiagramStoryNode(canvas, "API Gateway")).toHaveAttribute(
      "data-selected",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await expect(getUmlDiagramStoryNode(canvas, "API Gateway")).not.toHaveAttribute(
      "data-selected",
    );
  },
};

export const InteractiveCanvasUmlDiagram: Story = {
  name: "Interactive Canvas UML Diagram",
  render: () => (
    <UmlDiagram
      ariaLabel="Interactive canvas UML diagram"
      interactiveFeatures={true}
      nodes={serviceNodes}
      edges={serviceEdges}
      renderEdgeInspector={(context) => (
        <div className="grid gap-1">
          <div className="font-medium">Edge {context.edgeId}</div>
          <div className="text-xs text-muted-foreground">{context.kind}</div>
        </div>
      )}
    />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Search diagram" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Search diagram" }), "command");
    await expect(canvas.getByText("1 / 1")).toBeVisible();
    await expect(canvas.getByRole("dialog")).toBeVisible();
  },
};

function KeyboardNodeSelectionDemo() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("orders");
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>("orders");

  return (
    <UmlDiagram
      ariaLabel="Keyboard service dependency diagram"
      nodes={serviceNodes}
      edges={serviceEdges}
      selectedNodeId={selectedNodeId}
      focusedNodeId={focusedNodeId}
      onFocusedNodeIdChange={(node) => setFocusedNodeId(node?.id ?? null)}
      onNodeSelect={(node) => setSelectedNodeId(node.id)}
      onNodeDeselect={() => setSelectedNodeId(null)}
      nodeActionPlacement="outside-top-end"
      getNodeDisabled={(node) => node.id === "billing"}
      nodeActions={[{ id: "inspect", label: "Inspect" }]}
    />
  );
}
