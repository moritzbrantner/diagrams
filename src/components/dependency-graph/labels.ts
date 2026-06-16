import type { DependencyGraphNode, DependencyGraphNodeAction, DependencyGraphPart } from "./types";

export function getDependencyGraphNodeAccessibleName(node: DependencyGraphNode) {
  return typeof node.label === "string" || typeof node.label === "number"
    ? String(node.label)
    : node.id;
}

export function getDependencyGraphPartAccessibleName(part: DependencyGraphPart) {
  return typeof part.label === "string" || typeof part.label === "number"
    ? String(part.label)
    : part.id;
}

export function getDependencyGraphActionAccessibleLabel(action: DependencyGraphNodeAction) {
  return typeof action.label === "string" || typeof action.label === "number"
    ? String(action.label)
    : action.id;
}
