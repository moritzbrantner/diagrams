export type DiagramStructuredNode = {
  id: string;
  label: string;
  description?: string;
  group?: string;
};

export type DiagramStructuredEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  description?: string;
};

export type DiagramStructuredData = {
  nodes: DiagramStructuredNode[];
  edges: DiagramStructuredEdge[];
};

/**
 * Normalize the informational content of an interactive diagram into a stable,
 * renderer-independent structure suitable for lists, tables, search indexes,
 * exports, or other semantic alternatives.
 */
export function createDiagramStructuredData(
  nodes: readonly DiagramStructuredNode[],
  edges: readonly DiagramStructuredEdge[],
): DiagramStructuredData {
  const normalizedNodes = dedupeById(nodes, "node").map((node) => ({
    ...node,
    id: node.id.trim(),
    label: node.label.trim(),
    description: normalizeOptionalText(node.description),
    group: normalizeOptionalText(node.group),
  }));
  const nodeIds = new Set(normalizedNodes.map((node) => node.id));
  const normalizedEdges = dedupeById(edges, "edge").map((edge) => {
    const sourceId = edge.sourceId.trim();
    const targetId = edge.targetId.trim();

    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
      throw new Error(`diagram edge ${edge.id} references an unknown node`);
    }

    return {
      ...edge,
      id: edge.id.trim(),
      sourceId,
      targetId,
      label: normalizeOptionalText(edge.label),
      description: normalizeOptionalText(edge.description),
    };
  });

  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}

function dedupeById<T extends { id: string }>(items: readonly T[], kind: "node" | "edge"): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const id = item.id.trim();
    if (!id) {
      throw new Error(`diagram ${kind} id must not be empty`);
    }
    if (seen.has(id)) {
      throw new Error(`duplicate diagram ${kind} id: ${id}`);
    }
    seen.add(id);
    result.push(item);
  }

  return result;
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
