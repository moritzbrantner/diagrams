"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "../lib/cn";

type OrgChartNodeData = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  avatar?: React.ReactNode;
  children?: OrgChartNodeData[];
};

type OrgChartRenderNodeContext = {
  depth: number;
  index: number;
  siblingCount: number;
  parentNode?: OrgChartNodeData;
  path: string[];
  expanded: boolean;
  hasChildren: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  toggleExpanded: () => void;
  focusNode: () => void;
  selectNode: () => void;
};

type OrgChartKeyboardMode = "tree" | "none";

type OrgChartProps = React.ComponentProps<"div"> & {
  nodes?: readonly OrgChartNodeData[];
  emptyMessage?: React.ReactNode;
  renderNode?: (
    node: OrgChartNodeData,
    depth: number,
    context: OrgChartRenderNodeContext,
  ) => React.ReactNode;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedIdsChange?: (nodeIds: string[], node: OrgChartNodeData) => void;
  selectedNodeId?: string | null;
  keyboardMode?: OrgChartKeyboardMode;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  onFocusedNodeIdChange?: (
    nodeId: string | null,
    node: OrgChartNodeData | null,
    context: OrgChartRenderNodeContext | null,
  ) => void;
  getNodeDisabled?: (node: OrgChartNodeData, context: OrgChartRenderNodeContext) => boolean;
  nodeActions?:
    | readonly OrgChartNodeAction[]
    | ((
        node: OrgChartNodeData,
        context: OrgChartRenderNodeContext,
      ) => readonly OrgChartNodeAction[]);
  onNodeSelect?: (node: OrgChartNodeData, context: OrgChartRenderNodeContext) => void;
  onNodeActionSelect?: (
    action: OrgChartNodeAction,
    node: OrgChartNodeData,
    context: OrgChartRenderNodeContext,
  ) => void;
  defaultExpandedDepth?: number;
  maxRenderedNodes?: number;
};

type OrgChartVisibleNode = {
  node: OrgChartNodeData;
  depth: number;
  index: number;
  siblingCount: number;
  parentNode?: OrgChartNodeData;
  path: string[];
};

type OrgChartNodeAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (node: OrgChartNodeData, context: OrgChartRenderNodeContext) => void;
};

export type OrgChartNodeProps = React.ComponentProps<"div"> & {
  node: OrgChartNodeData;
  depth?: number;
  index?: number;
  siblingCount?: number;
  parentNode?: OrgChartNodeData;
  path?: string[];
  renderNode?: OrgChartProps["renderNode"];
  nodeActions?: OrgChartProps["nodeActions"];
  expanded?: boolean;
  defaultExpanded?: boolean;
  selected?: boolean;
  selectedNodeId?: string | null;
  focused?: boolean;
  focusedNodeId?: string | null;
  disabled?: boolean;
  keyboardMode?: OrgChartKeyboardMode;
  onExpandedChange?: (expanded: boolean, node: OrgChartNodeData) => void;
  getNodeExpanded?: (node: OrgChartNodeData) => boolean;
  onToggleNode?: (node: OrgChartNodeData, expanded: boolean) => void;
  onFocusNode?: (node: OrgChartNodeData, context: OrgChartRenderNodeContext) => void;
  onNodeKeyDown?: (
    event: React.KeyboardEvent<HTMLDivElement>,
    node: OrgChartNodeData,
    context: OrgChartRenderNodeContext,
  ) => void;
  getNodeDisabled?: OrgChartProps["getNodeDisabled"];
  onNodeSelect?: OrgChartProps["onNodeSelect"];
  onNodeActionSelect?: OrgChartProps["onNodeActionSelect"];
};

function OrgChart({
  nodes = [],
  emptyMessage = "No organization data.",
  renderNode,
  expandedIds,
  defaultExpandedIds,
  onExpandedIdsChange,
  selectedNodeId,
  keyboardMode = "tree",
  focusedNodeId,
  defaultFocusedNodeId,
  onFocusedNodeIdChange,
  getNodeDisabled,
  nodeActions,
  onNodeSelect,
  onNodeActionSelect,
  defaultExpandedDepth,
  maxRenderedNodes,
  children,
  className,
  ...props
}: OrgChartProps) {
  const defaultExpandableIds = React.useMemo(
    () => collectExpandableNodeIds(nodes, defaultExpandedDepth),
    [defaultExpandedDepth, nodes],
  );
  const [internalExpandedIds, setInternalExpandedIds] = React.useState<string[] | undefined>(() =>
    defaultExpandedIds ? [...defaultExpandedIds] : undefined,
  );
  const currentExpandedIds = React.useMemo(
    () => new Set(expandedIds ?? internalExpandedIds ?? defaultExpandableIds),
    [defaultExpandableIds, expandedIds, internalExpandedIds],
  );
  const visibleNodes = React.useMemo(
    () => getVisibleOrgChartNodes(nodes, currentExpandedIds),
    [currentExpandedIds, nodes],
  );
  const renderedNodeIds = React.useMemo(
    () =>
      typeof maxRenderedNodes === "number"
        ? new Set(visibleNodes.slice(0, Math.max(0, maxRenderedNodes)).map((item) => item.node.id))
        : undefined,
    [maxRenderedNodes, visibleNodes],
  );
  const nodeRefs = React.useRef(new Map<string, HTMLDivElement>());
  const [internalFocusedNodeId, setInternalFocusedNodeId] = React.useState<string | null>(
    () => defaultFocusedNodeId ?? null,
  );
  const isNodeDisabled = React.useCallback(
    (item: OrgChartVisibleNode) =>
      getNodeDisabled?.(
        item.node,
        createOrgChartContext({
          ...item,
          expanded: item.node.children?.length ? currentExpandedIds.has(item.node.id) : false,
          selected: selectedNodeId === item.node.id,
          focused: false,
          disabled: false,
          toggleExpanded: () => undefined,
          focusNode: () => undefined,
          selectNode: () => undefined,
        }),
      ) ?? false,
    [currentExpandedIds, getNodeDisabled, selectedNodeId],
  );
  const enabledVisibleNodes = React.useMemo(
    () => visibleNodes.filter((item) => !isNodeDisabled(item)),
    [isNodeDisabled, visibleNodes],
  );
  const requestedFocusedNodeId =
    focusedNodeId !== undefined ? focusedNodeId : internalFocusedNodeId;
  const effectiveFocusedNodeId =
    enabledVisibleNodes.find((item) => item.node.id === requestedFocusedNodeId)?.node.id ??
    enabledVisibleNodes[0]?.node.id ??
    null;

  const toggleNode = React.useCallback(
    (node: OrgChartNodeData, expanded: boolean) => {
      const nextExpandedIds = expanded
        ? Array.from(new Set([...currentExpandedIds, node.id]))
        : Array.from(currentExpandedIds).filter((nodeId) => nodeId !== node.id);

      if (!expandedIds) {
        setInternalExpandedIds(nextExpandedIds);
      }

      onExpandedIdsChange?.(nextExpandedIds, node);
    },
    [currentExpandedIds, expandedIds, onExpandedIdsChange],
  );
  const setNodeRef = React.useCallback((nodeId: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);
  const getFocusChangeContext = React.useCallback(
    (item: OrgChartVisibleNode, focused: boolean) =>
      createOrgChartContext({
        ...item,
        expanded: item.node.children?.length ? currentExpandedIds.has(item.node.id) : false,
        selected: selectedNodeId === item.node.id,
        focused,
        disabled: isNodeDisabled(item),
        toggleExpanded: () => toggleNode(item.node, !currentExpandedIds.has(item.node.id)),
        focusNode: () => undefined,
        selectNode: () => undefined,
      }),
    [currentExpandedIds, isNodeDisabled, selectedNodeId, toggleNode],
  );
  const focusNodeById = React.useCallback(
    (nodeId: string | null, shouldFocusElement = true) => {
      const item = nodeId
        ? visibleNodes.find((visibleNode) => visibleNode.node.id === nodeId)
        : null;

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(nodeId);
      }

      onFocusedNodeIdChange?.(
        nodeId,
        item?.node ?? null,
        item ? getFocusChangeContext(item, true) : null,
      );

      if (nodeId && shouldFocusElement) {
        queueMicrotask(() => nodeRefs.current.get(nodeId)?.focus());
      }
    },
    [focusedNodeId, getFocusChangeContext, onFocusedNodeIdChange, visibleNodes],
  );
  const focusVisibleItem = React.useCallback(
    (item: OrgChartVisibleNode | undefined) => {
      if (!item || isNodeDisabled(item)) {
        return;
      }

      focusNodeById(item.node.id);
    },
    [focusNodeById, isNodeDisabled],
  );
  const handleFocusNode = React.useCallback(
    (node: OrgChartNodeData, context: OrgChartRenderNodeContext) => {
      if (context.disabled) {
        return;
      }

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(node.id);
      }

      onFocusedNodeIdChange?.(node.id, node, context);
    },
    [focusedNodeId, onFocusedNodeIdChange],
  );
  const handleNodeKeyDown = React.useCallback(
    (
      event: React.KeyboardEvent<HTMLDivElement>,
      node: OrgChartNodeData,
      context: OrgChartRenderNodeContext,
    ) => {
      if (context.disabled) {
        return;
      }

      if (isActivationKey(event)) {
        if (onNodeSelect) {
          event.preventDefault();
          context.selectNode();
        }

        return;
      }

      if (keyboardMode === "none") {
        return;
      }

      const currentIndex = enabledVisibleNodes.findIndex((item) => item.node.id === node.id);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusVisibleItem(enabledVisibleNodes[currentIndex + 1] ?? enabledVisibleNodes[0]);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusVisibleItem(
            enabledVisibleNodes[currentIndex - 1] ??
              enabledVisibleNodes[enabledVisibleNodes.length - 1],
          );
          break;
        case "ArrowRight":
          if (!context.hasChildren) {
            return;
          }

          event.preventDefault();
          if (!context.expanded) {
            toggleNode(node, true);
          }

          focusVisibleItem(
            getVisibleOrgChartNodes(nodes, new Set([...currentExpandedIds, node.id])).find(
              (item) => item.parentNode?.id === node.id && !isNodeDisabled(item),
            ),
          );
          break;
        case "ArrowLeft":
          if (context.hasChildren && context.expanded) {
            event.preventDefault();
            toggleNode(node, false);
          } else if (context.parentNode) {
            event.preventDefault();
            focusVisibleItem(visibleNodes.find((item) => item.node.id === context.parentNode?.id));
          }
          break;
        case "Home":
          event.preventDefault();
          focusVisibleItem(enabledVisibleNodes[0]);
          break;
        case "End":
          event.preventDefault();
          focusVisibleItem(enabledVisibleNodes[enabledVisibleNodes.length - 1]);
          break;
      }
    },
    [
      currentExpandedIds,
      enabledVisibleNodes,
      focusVisibleItem,
      isNodeDisabled,
      keyboardMode,
      nodes,
      onNodeSelect,
      toggleNode,
      visibleNodes,
    ],
  );

  return (
    <div
      data-slot="org-chart"
      className={cn(
        "min-w-0 overflow-x-auto rounded-md border bg-card p-4 text-card-foreground",
        className,
      )}
      {...props}
    >
      {nodes.length ? (
        <div
          data-slot="org-chart-roots"
          role="tree"
          className="flex min-w-max gap-6 md:justify-center"
        >
          {nodes.map((node, index) => (
            <OrgChartNode
              key={node.id}
              node={node}
              index={index}
              siblingCount={nodes.length}
              path={[node.id]}
              renderNode={renderNode}
              nodeActions={nodeActions}
              getNodeExpanded={(chartNode) => currentExpandedIds.has(chartNode.id)}
              onToggleNode={toggleNode}
              selectedNodeId={selectedNodeId}
              focused={effectiveFocusedNodeId === node.id}
              focusedNodeId={effectiveFocusedNodeId}
              keyboardMode={keyboardMode}
              getNodeDisabled={getNodeDisabled}
              onFocusNode={handleFocusNode}
              onNodeKeyDown={handleNodeKeyDown}
              onNodeSelect={onNodeSelect}
              onNodeActionSelect={onNodeActionSelect}
              setNodeRef={setNodeRef}
              renderedNodeIds={renderedNodeIds}
            />
          ))}
        </div>
      ) : (
        (children ?? (
          <div data-slot="org-chart-empty" className="text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ))
      )}
    </div>
  );
}

const OrgChartNode = React.memo(function OrgChartNode({
  node,
  depth = 0,
  index = 0,
  siblingCount = 1,
  parentNode,
  path = [node.id],
  renderNode,
  nodeActions,
  expanded: expandedProp,
  defaultExpanded = true,
  selected: selectedProp,
  selectedNodeId,
  focused: focusedProp,
  focusedNodeId,
  disabled: disabledProp,
  keyboardMode = "tree",
  onExpandedChange,
  getNodeExpanded,
  onToggleNode,
  onFocusNode,
  onNodeKeyDown,
  getNodeDisabled,
  onNodeSelect,
  onNodeActionSelect,
  setNodeRef,
  renderedNodeIds,
  className,
  ...props
}: OrgChartNodeProps & {
  setNodeRef?: (nodeId: string, element: HTMLDivElement | null) => void;
  renderedNodeIds?: ReadonlySet<string>;
}) {
  if (renderedNodeIds && !renderedNodeIds.has(node.id)) {
    return null;
  }

  const hasChildren = Boolean(node.children?.length);
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
  const expanded = hasChildren
    ? (getNodeExpanded?.(node) ?? expandedProp ?? internalExpanded)
    : false;
  const selected = selectedProp ?? selectedNodeId === node.id;
  const focused = focusedProp ?? focusedNodeId === node.id;
  const accessibleName = getNodeAccessibleName(node);
  const toggleExpanded = React.useCallback(() => {
    const nextExpanded = !expanded;

    if (expandedProp === undefined && !getNodeExpanded) {
      setInternalExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded, node);
    onToggleNode?.(node, nextExpanded);
  }, [expanded, expandedProp, getNodeExpanded, node, onExpandedChange, onToggleNode]);

  const disabled =
    disabledProp ??
    getNodeDisabled?.(
      node,
      createOrgChartContext({
        depth,
        index,
        siblingCount,
        parentNode,
        path,
        node,
        expanded,
        hasChildren,
        selected,
        focused,
        disabled: false,
        toggleExpanded,
        focusNode: () => undefined,
        selectNode: () => undefined,
      }),
    ) ??
    false;
  const renderContext = React.useMemo<OrgChartRenderNodeContext>(() => {
    let context: OrgChartRenderNodeContext;

    context = createOrgChartContext({
      depth,
      index,
      siblingCount,
      parentNode,
      path,
      node,
      expanded,
      hasChildren,
      selected,
      focused,
      disabled,
      toggleExpanded,
      focusNode: () => onFocusNode?.(node, context),
      selectNode: () => onNodeSelect?.(node, context),
    });

    return context;
  }, [
    depth,
    disabled,
    expanded,
    focused,
    hasChildren,
    index,
    node,
    onFocusNode,
    onNodeSelect,
    parentNode,
    path,
    selected,
    siblingCount,
    toggleExpanded,
  ]);
  const resolvedActions = React.useMemo(
    () =>
      typeof nodeActions === "function" ? nodeActions(node, renderContext) : (nodeActions ?? []),
    [node, nodeActions, renderContext],
  );
  const hasNestedControls = hasChildren || resolvedActions.length > 0;
  const selectNode = React.useCallback(() => {
    if (!disabled) {
      renderContext.selectNode();
    }
  }, [disabled, renderContext]);
  const handleNodeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onNodeKeyDown?.(event, node, renderContext);
    },
    [node, onNodeKeyDown, renderContext],
  );

  return (
    <div
      data-slot="org-chart-node-branch"
      data-depth={depth}
      role="treeitem"
      aria-label={accessibleName}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      aria-level={depth + 1}
      aria-posinset={index + 1}
      aria-setsize={siblingCount}
      className={cn("grid justify-items-center gap-3", className)}
      {...props}
    >
      <div
        data-slot="org-chart-node"
        data-selected={selected ? "true" : undefined}
        data-focused={focused ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        role={onNodeSelect && !hasNestedControls ? "button" : undefined}
        tabIndex={
          keyboardMode === "tree" && focused && !disabled
            ? 0
            : onNodeSelect && keyboardMode === "none" && !disabled
              ? 0
              : -1
        }
        aria-label={onNodeSelect && !hasNestedControls ? accessibleName : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "relative min-w-56 rounded-md border bg-background p-3 shadow-sm outline-none transition-colors",
          selected && "border-primary ring-2 ring-primary/20",
          focused && !selected && "ring-2 ring-ring/35",
          disabled && "opacity-60",
          onNodeSelect &&
            "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        )}
        ref={(element) => setNodeRef?.(node.id, element)}
        onClick={onNodeSelect ? selectNode : undefined}
        onFocus={() => renderContext.focusNode()}
        onKeyDown={handleNodeKeyDown}
      >
        {hasChildren ? (
          <button
            type="button"
            data-slot="org-chart-node-toggle"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${accessibleName}`}
            aria-expanded={expanded}
            className={cn(
              "absolute right-1 top-1 inline-grid size-10 place-items-center rounded-sm text-muted-foreground outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
              "[&_svg]:size-4",
            )}
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
          >
            {expanded ? (
              <ChevronDownIcon aria-hidden="true" />
            ) : (
              <ChevronRightIcon aria-hidden="true" />
            )}
          </button>
        ) : null}
        <div className={cn(hasChildren && "pr-10")}>
          {renderNode ? (
            renderNode(node, depth, renderContext)
          ) : (
            <div className="flex min-w-0 items-start gap-3">
              {node.avatar ? (
                <div data-slot="org-chart-node-avatar" className="shrink-0">
                  {node.avatar}
                </div>
              ) : null}
              <div className="grid min-w-0 gap-1">
                <div data-slot="org-chart-node-label" className="font-medium leading-5">
                  {node.label}
                </div>
                {node.description ? (
                  <div
                    data-slot="org-chart-node-description"
                    className="text-sm leading-5 text-muted-foreground"
                  >
                    {node.description}
                  </div>
                ) : null}
                {node.meta ? (
                  <div data-slot="org-chart-node-meta" className="text-xs text-muted-foreground">
                    {node.meta}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
        {resolvedActions.length ? (
          <div data-slot="org-chart-node-actions" className="mt-3 flex flex-wrap gap-1.5">
            {resolvedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                data-slot="org-chart-node-action"
                data-action-id={action.id}
                data-destructive={action.destructive ? "true" : undefined}
                aria-label={getActionAccessibleLabel(action)}
                disabled={action.disabled}
                className={cn(
                  "inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-sm border px-2 text-xs font-medium outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                  action.destructive &&
                    "text-destructive hover:bg-destructive/10 hover:text-destructive",
                  action.icon && "px-0 [&_svg]:size-3.5",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onSelect?.(node, renderContext);
                  onNodeActionSelect?.(action, node, renderContext);
                }}
              >
                {action.icon ?? action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {hasChildren && expanded ? (
        <>
          <div data-slot="org-chart-connector" aria-hidden="true" className="h-6 w-px bg-border" />
          <div
            data-slot="org-chart-children"
            role="group"
            className="grid gap-3 md:flex md:items-start md:gap-4"
          >
            {node.children?.map((child, childIndex) => (
              <OrgChartNode
                key={child.id}
                node={child}
                depth={depth + 1}
                index={childIndex}
                parentNode={node}
                path={[...path, child.id]}
                renderNode={renderNode}
                nodeActions={nodeActions}
                getNodeExpanded={getNodeExpanded}
                onToggleNode={onToggleNode}
                selectedNodeId={selectedNodeId}
                focusedNodeId={focusedNodeId}
                keyboardMode={keyboardMode}
                getNodeDisabled={getNodeDisabled}
                onFocusNode={onFocusNode}
                onNodeKeyDown={onNodeKeyDown}
                onNodeSelect={onNodeSelect}
                onNodeActionSelect={onNodeActionSelect}
                setNodeRef={setNodeRef}
                renderedNodeIds={renderedNodeIds}
                siblingCount={node.children?.length ?? 0}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
});

function collectExpandableNodeIds(
  nodes: readonly OrgChartNodeData[],
  maxDepth = Number.POSITIVE_INFINITY,
  depth = 0,
) {
  const expandedNodeIds: string[] = [];

  for (const node of nodes) {
    if (node.children?.length && depth < maxDepth) {
      expandedNodeIds.push(node.id);
      expandedNodeIds.push(...collectExpandableNodeIds(node.children, maxDepth, depth + 1));
    }
  }

  return expandedNodeIds;
}

function findOrgChartNode(
  nodes: readonly OrgChartNodeData[],
  nodeId: string,
): { node: OrgChartNodeData; path: string[] } | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return { node, path: [node.id] };
    }

    if (node.children?.length) {
      const childMatch = findOrgChartNode(node.children, nodeId);

      if (childMatch) {
        return { node: childMatch.node, path: [node.id, ...childMatch.path] };
      }
    }
  }

  return null;
}

function getVisibleOrgChartNodes(
  nodes: readonly OrgChartNodeData[],
  expandedIds: ReadonlySet<string>,
): OrgChartVisibleNode[] {
  const visibleNodes: OrgChartVisibleNode[] = [];

  function visit(
    currentNodes: readonly OrgChartNodeData[],
    depth: number,
    parentNode: OrgChartNodeData | undefined,
    parentPath: string[],
  ) {
    currentNodes.forEach((node, index) => {
      const path = [...parentPath, node.id];

      visibleNodes.push({
        node,
        depth,
        index,
        siblingCount: currentNodes.length,
        parentNode,
        path,
      });

      if (node.children?.length && expandedIds.has(node.id)) {
        visit(node.children, depth + 1, node, path);
      }
    });
  }

  visit(nodes, 0, undefined, []);

  return visibleNodes;
}

function createOrgChartContext({
  node,
  depth,
  index,
  siblingCount,
  parentNode,
  path,
  expanded,
  hasChildren = Boolean(node.children?.length),
  selected,
  focused,
  disabled,
  toggleExpanded,
  focusNode,
  selectNode,
}: OrgChartVisibleNode & {
  expanded: boolean;
  hasChildren?: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  toggleExpanded: () => void;
  focusNode: () => void;
  selectNode: () => void;
}): OrgChartRenderNodeContext {
  return {
    depth,
    index,
    siblingCount,
    parentNode,
    path,
    expanded,
    hasChildren,
    selected,
    focused,
    disabled,
    toggleExpanded,
    focusNode,
    selectNode,
  };
}

function getNodeAccessibleName(node: OrgChartNodeData) {
  return typeof node.label === "string" || typeof node.label === "number"
    ? String(node.label)
    : node.id;
}

function getActionAccessibleLabel(action: OrgChartNodeAction) {
  return typeof action.label === "string" || typeof action.label === "number"
    ? String(action.label)
    : action.id;
}

function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

function insertOrgChartNode(
  nodes: readonly OrgChartNodeData[],
  parentNodeId: string | null,
  node: OrgChartNodeData,
): OrgChartNodeData[] {
  if (parentNodeId == null) {
    return [...nodes, node];
  }

  return nodes.map((currentNode) => {
    if (currentNode.id === parentNodeId) {
      return {
        ...currentNode,
        children: [...(currentNode.children ?? []), node],
      };
    }

    if (!currentNode.children?.length) {
      return currentNode;
    }

    return {
      ...currentNode,
      children: insertOrgChartNode(currentNode.children, parentNodeId, node),
    };
  });
}

function updateOrgChartNode(
  nodes: readonly OrgChartNodeData[],
  nodeId: string,
  updater: (node: OrgChartNodeData) => OrgChartNodeData,
): OrgChartNodeData[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: updateOrgChartNode(node.children, nodeId, updater),
    };
  });
}

function removeOrgChartNode(
  nodes: readonly OrgChartNodeData[],
  nodeId: string,
): OrgChartNodeData[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) =>
      node.children?.length
        ? {
            ...node,
            children: removeOrgChartNode(node.children, nodeId),
          }
        : node,
    );
}

export { OrgChart, OrgChartNode };
export {
  findOrgChartNode,
  getVisibleOrgChartNodes,
  insertOrgChartNode,
  removeOrgChartNode,
  updateOrgChartNode,
};
export type {
  OrgChartKeyboardMode,
  OrgChartProps,
  OrgChartNodeAction,
  OrgChartNodeData,
  OrgChartRenderNodeContext,
  OrgChartVisibleNode,
};
