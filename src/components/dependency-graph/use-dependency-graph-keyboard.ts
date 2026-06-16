import * as React from "react";

import { isActivationKey } from "../diagram-utils";

import { getNearestDependencyGraphNode } from "./layout";

import type {
  DependencyGraphKeyboardMode,
  DependencyGraphProps,
  PositionedDependencyGraphNode,
  RenderDependencyGraphNode,
} from "./types";

export function useDependencyGraphKeyboard({
  defaultFocusedNodeId,
  enabledNodes,
  focusedNodeId,
  getNodeDisabled,
  nodeMap,
  onFocusedNodeIdChange,
  onNodeDeselect,
  onNodeSelect,
  resolvedKeyboardMode,
  selectedNodeId,
}: {
  defaultFocusedNodeId?: string | null;
  enabledNodes: readonly PositionedDependencyGraphNode[];
  focusedNodeId?: string | null;
  getNodeDisabled?: DependencyGraphProps["getNodeDisabled"];
  nodeMap: Map<string, RenderDependencyGraphNode>;
  onFocusedNodeIdChange?: DependencyGraphProps["onFocusedNodeIdChange"];
  onNodeDeselect?: DependencyGraphProps["onNodeDeselect"];
  onNodeSelect?: DependencyGraphProps["onNodeSelect"];
  resolvedKeyboardMode: DependencyGraphKeyboardMode;
  selectedNodeId?: string | null;
}) {
  const nodeRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedNodeId, setInternalFocusedNodeId] = React.useState<string | null>(
    () => defaultFocusedNodeId ?? null,
  );
  const requestedFocusedNodeId =
    focusedNodeId !== undefined ? focusedNodeId : internalFocusedNodeId;
  const effectiveFocusedNodeId =
    resolvedKeyboardMode === "nodes"
      ? (enabledNodes.find((node) => node.id === requestedFocusedNodeId)?.id ??
        enabledNodes[0]?.id ??
        null)
      : null;

  const setNodeRef = React.useCallback((nodeId: string, element: SVGGElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);

  const focusNodeById = React.useCallback(
    (nodeId: string | null, shouldFocusElement = true) => {
      const nextNode = nodeId ? (nodeMap.get(nodeId) ?? null) : null;

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(nodeId);
      }

      onFocusedNodeIdChange?.(nextNode);

      if (nodeId && shouldFocusElement) {
        queueMicrotask(() => nodeRefs.current.get(nodeId)?.focus());
      }
    },
    [focusedNodeId, nodeMap, onFocusedNodeIdChange],
  );

  const handleNodeFocus = React.useCallback(
    (node: PositionedDependencyGraphNode) => {
      if (getNodeDisabled?.(node)) {
        return;
      }

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(node.id);
      }

      onFocusedNodeIdChange?.(node);
    },
    [focusedNodeId, getNodeDisabled, onFocusedNodeIdChange],
  );

  const handleNodeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, node: PositionedDependencyGraphNode) => {
      if (resolvedKeyboardMode === "none" || getNodeDisabled?.(node)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onNodeSelect?.(node);
        return;
      }

      if (event.key === "Escape") {
        if (selectedNodeId != null && onNodeSelect && onNodeDeselect) {
          event.preventDefault();
          onNodeDeselect();
        }

        return;
      }

      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      event.preventDefault();

      const nextNode = getNearestDependencyGraphNode(
        node,
        enabledNodes.filter((item) => item.id !== node.id),
        event.key,
      );

      if (nextNode) {
        focusNodeById(nextNode.id);
      }
    },
    [
      enabledNodes,
      focusNodeById,
      getNodeDisabled,
      onNodeDeselect,
      onNodeSelect,
      resolvedKeyboardMode,
      selectedNodeId,
    ],
  );

  return {
    effectiveFocusedNodeId,
    handleNodeFocus,
    handleNodeKeyDown,
    setNodeRef,
  };
}
