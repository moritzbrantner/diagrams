import { getDependencyGraphNodeAccessibleName } from "./labels";

import type {
  DependencyGraphNodeMinimizeControl,
  DependencyGraphPart,
  DependencyGraphMinimizeControls,
  PositionedDependencyGraphNode,
  RenderDependencyGraphNode,
} from "./types";

export function getDependencyGraphNodeMinimizeControl({
  collapsibleNodeHiddenNodes,
  minimizeControls,
  node,
  nodeMinimizeEnabled,
  onToggleNodeMinimized,
  onTogglePartMinimized,
}: {
  collapsibleNodeHiddenNodes: Map<string, readonly PositionedDependencyGraphNode[]>;
  minimizeControls: DependencyGraphMinimizeControls;
  node: RenderDependencyGraphNode;
  nodeMinimizeEnabled: boolean;
  onToggleNodeMinimized: (node: PositionedDependencyGraphNode, minimized: boolean) => void;
  onTogglePartMinimized: (part: DependencyGraphPart, minimized: boolean) => void;
}): DependencyGraphNodeMinimizeControl | undefined {
  if (minimizeControls === "none") {
    return undefined;
  }

  if (node.summary?.kind === "part" && node.summary.part) {
    const label = getDependencyGraphNodeAccessibleName(node);

    return {
      ariaLabel: `Expand ${label}`,
      expanded: false,
      onToggle: () => onTogglePartMinimized(node.summary!.part!, false),
    };
  }

  if (node.summary?.kind === "node" && node.summary.rootNode) {
    const label = getDependencyGraphNodeAccessibleName(node);

    return {
      ariaLabel: `Expand ${label}`,
      expanded: false,
      onToggle: () => onToggleNodeMinimized(node.summary!.rootNode!, false),
    };
  }

  if (!nodeMinimizeEnabled || node.minimizable === false) {
    return undefined;
  }

  const hiddenNodes = collapsibleNodeHiddenNodes.get(node.id);

  if (!hiddenNodes?.length && minimizeControls !== "always") {
    return undefined;
  }

  const label = getDependencyGraphNodeAccessibleName(node);

  return {
    ariaLabel: `Minimize ${label}`,
    expanded: true,
    onToggle: () => {
      if (hiddenNodes?.length) {
        onToggleNodeMinimized(node, true);
      }
    },
  };
}
