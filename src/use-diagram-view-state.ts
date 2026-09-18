"use client";

import * as React from "react";

import {
  applyDiagramViewDelta,
  type DiagramViewDelta,
  type DiagramViewState,
} from "./view-state";
import type { DiagramInteractiveProps } from "./diagram-types";

export type UseDiagramViewStateOptions = {
  value?: DiagramViewState;
  defaultValue?: DiagramViewState;
  onChange?: (state: DiagramViewState, delta: DiagramViewDelta) => void;
  onDelta?: (delta: DiagramViewDelta) => void;
};

/**
 * Owns one durable diagram view-state object and applies small idempotent deltas to it.
 *
 * Pointer/focus preview state intentionally does not live here. Consumers should dispatch durable
 * highlight or inspector deltas only from semantic actions such as selection, pinning, or opening
 * details.
 */
export function useDiagramViewState({
  value,
  defaultValue = {},
  onChange,
  onDelta,
}: UseDiagramViewStateOptions = {}) {
  const [internalState, setInternalState] = React.useState<DiagramViewState>(defaultValue);
  const state = value ?? internalState;
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatch = React.useCallback(
    (delta: DiagramViewDelta) => {
      const current = stateRef.current;
      const next = applyDiagramViewDelta(current, delta);

      if (next === current) {
        return;
      }

      stateRef.current = next;
      if (value === undefined) {
        setInternalState(next);
      }
      onDelta?.(delta);
      onChange?.(next, delta);
    },
    [onChange, onDelta, value],
  );

  return [state, dispatch] as const;
}

export type DurableDiagramInteractionProps = Pick<
  DiagramInteractiveProps<unknown, unknown>,
  | "viewport"
  | "onViewportChange"
  | "highlightedElement"
  | "searchQuery"
  | "onSearchQueryChange"
  | "inspectedEdgeId"
>;

/**
 * Adapts durable view state to the shared canvas props without wiring preview callbacks back into
 * durable state. Highlight and inspector mutations stay explicit at the semantic interaction site.
 */
export function getDurableDiagramInteractionProps(
  state: DiagramViewState,
  dispatch: (delta: DiagramViewDelta) => void,
): DurableDiagramInteractionProps {
  return {
    viewport: state.viewport,
    onViewportChange: (viewport, reason) =>
      dispatch({ type: "viewport", viewport, reason }),
    ...(state.highlightedElement !== undefined
      ? { highlightedElement: state.highlightedElement }
      : {}),
    searchQuery: state.searchQuery ?? "",
    onSearchQueryChange: (query) => dispatch({ type: "search-query", query }),
    ...(state.inspectedEdgeId !== undefined ? { inspectedEdgeId: state.inspectedEdgeId } : {}),
  };
}
