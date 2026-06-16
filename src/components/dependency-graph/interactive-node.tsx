import { cn } from "@moritzbrantner/ui";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import * as React from "react";

import {
  getDependencyGraphActionAccessibleLabel,
  getDependencyGraphNodeAccessibleName,
} from "./labels";
import { DependencyGraphNodeShape } from "./node-shape";

import type {
  DependencyGraphKeyboardMode,
  DependencyGraphNodeAction,
  DependencyGraphNodeActionPlacement,
  DependencyGraphNodeMinimizeControl,
  DependencyGraphProps,
  PositionedDependencyGraphNode,
  RenderDependencyGraphNode,
} from "./types";

export function DependencyGraphInteractiveNode({
  node,
  minimizeControl,
  nodeActions,
  nodeActionPlacement,
  selected,
  focused,
  disabled,
  keyboardMode,
  renderNodeSelection,
  onNodeActionSelect,
  onNodeFocus,
  onNodeKeyDown,
  onNodeSelect,
  setNodeRef,
  highlightState,
  interactionProps,
}: {
  node: RenderDependencyGraphNode;
  minimizeControl?: DependencyGraphNodeMinimizeControl;
  nodeActions?: DependencyGraphProps["nodeActions"];
  nodeActionPlacement: DependencyGraphNodeActionPlacement;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: DependencyGraphKeyboardMode;
  renderNodeSelection?: DependencyGraphProps["renderNodeSelection"];
  onNodeActionSelect?: DependencyGraphProps["onNodeActionSelect"];
  onNodeFocus: (node: PositionedDependencyGraphNode) => void;
  onNodeKeyDown: (
    event: React.KeyboardEvent<SVGGElement>,
    node: PositionedDependencyGraphNode,
  ) => void;
  onNodeSelect?: DependencyGraphProps["onNodeSelect"];
  setNodeRef: (nodeId: string, element: SVGGElement | null) => void;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
}) {
  const resolvedActions =
    typeof nodeActions === "function" ? nodeActions(node) : (nodeActions ?? []);
  const interactive = Boolean(onNodeSelect) && !disabled;
  const accessibleName = getDependencyGraphNodeAccessibleName(node);
  const selectNode = React.useCallback(() => {
    if (!disabled) {
      onNodeSelect?.(node);
    }
  }, [disabled, node, onNodeSelect]);
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>) => {
      onNodeKeyDown(event, node);
    },
    [node, onNodeKeyDown],
  );

  return (
    <g
      data-slot="dependency-graph-node-interaction"
      data-node-id={node.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-highlight-state={highlightState}
      role={onNodeSelect && resolvedActions.length === 0 ? "button" : undefined}
      aria-label={onNodeSelect && resolvedActions.length === 0 ? accessibleName : undefined}
      aria-pressed={onNodeSelect && resolvedActions.length === 0 ? selected : undefined}
      aria-disabled={
        onNodeSelect && resolvedActions.length === 0 ? disabled || undefined : undefined
      }
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={cn(
        "outline-none",
        onNodeSelect &&
          "cursor-pointer focus-visible:[&_[data-slot='dependency-graph-node-focus']]:stroke-ring",
        disabled && "opacity-60",
        "transition-opacity data-[highlight-state=related]:opacity-100 data-[disabled=true]:data-[highlight-state=related]:opacity-60 data-[highlight-state=dimmed]:opacity-25 data-[highlight-state=active]:[&_[data-slot='dependency-graph-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot='dependency-graph-summary-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot='dependency-graph-node']>div]:ring-ring/60 data-[highlight-state=active]:[&_[data-slot='dependency-graph-summary-node']>div]:ring-ring/60",
      )}
      onClick={interactive ? selectNode : undefined}
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={(event) => {
        interactionProps?.onFocus?.(event);
        onNodeFocus(node);
      }}
      onBlur={interactionProps?.onBlur}
      onKeyDown={(event) => {
        interactionProps?.onKeyDown?.(event);
        handleKeyDown(event);
      }}
      ref={(element) => setNodeRef(node.id, element)}
    >
      {selected ? (
        (renderNodeSelection?.(node) ?? (
          <rect
            data-slot="dependency-graph-node-focus"
            x={node.x - 6}
            y={node.y - 6}
            width={node.width + 12}
            height={node.height + 12}
            rx="12"
            className="fill-transparent stroke-primary stroke-2"
          />
        ))
      ) : focused ? (
        <rect
          data-slot="dependency-graph-node-focus"
          x={node.x - 6}
          y={node.y - 6}
          width={node.width + 12}
          height={node.height + 12}
          rx="12"
          className="fill-transparent stroke-ring stroke-2"
        />
      ) : null}
      <DependencyGraphNodeShape node={node} />
      {minimizeControl ? (
        <DependencyGraphNodeMinimizeButton control={minimizeControl} node={node} />
      ) : null}
      {resolvedActions.length ? (
        <DependencyGraphNodeActions
          actions={resolvedActions}
          node={node}
          placement={nodeActionPlacement}
          onNodeActionSelect={onNodeActionSelect}
        />
      ) : null}
    </g>
  );
}

function DependencyGraphNodeMinimizeButton({
  control,
  node,
}: {
  control: DependencyGraphNodeMinimizeControl;
  node: RenderDependencyGraphNode;
}) {
  return (
    <foreignObject x={node.x + node.width - 36} y={node.y + 8} width={28} height={28}>
      <button
        type="button"
        data-slot="dependency-graph-node-minimize-control"
        aria-label={control.ariaLabel}
        aria-expanded={control.expanded}
        className="inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-muted-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={(event) => {
          event.stopPropagation();
          control.onToggle();
        }}
      >
        {control.expanded ? (
          <Minimize2Icon aria-hidden="true" className="size-3.5" />
        ) : (
          <Maximize2Icon aria-hidden="true" className="size-3.5" />
        )}
      </button>
    </foreignObject>
  );
}

function DependencyGraphNodeActions({
  actions,
  node,
  placement,
  onNodeActionSelect,
}: {
  actions: readonly DependencyGraphNodeAction[];
  node: PositionedDependencyGraphNode;
  placement: DependencyGraphNodeActionPlacement;
  onNodeActionSelect?: DependencyGraphProps["onNodeActionSelect"];
}) {
  const actionSize = 28;
  const actionGap = 4;
  const width = actions.length * actionSize + Math.max(0, actions.length - 1) * actionGap;
  const x = node.x + node.width - width - 8;
  const y =
    placement === "outside-top-end"
      ? node.y - actionSize - 4
      : node.y + node.height - actionSize - 8;

  return (
    <foreignObject
      data-slot="dependency-graph-node-actions"
      data-placement={placement}
      x={x}
      y={y}
      width={width}
      height={actionSize}
    >
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot="dependency-graph-node-action"
            data-action-id={action.id}
            data-destructive={action.destructive ? "true" : undefined}
            aria-label={getDependencyGraphActionAccessibleLabel(action)}
            disabled={action.disabled}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium text-foreground shadow-sm outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              action.destructive &&
                "text-destructive hover:bg-destructive/10 hover:text-destructive",
              "[&_svg]:size-3.5",
            )}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect?.(node);
              onNodeActionSelect?.(action, node);
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </foreignObject>
  );
}
