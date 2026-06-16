"use client";

import * as React from "react";

import type { DiagramBoundsItem, DiagramItemAction } from "../diagram-types";

export function DiagramSvgItemInteraction<
  TItem extends Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">> & {
    id: string;
    label?: React.ReactNode;
  },
>({
  item,
  slot,
  selected,
  focused,
  disabled,
  keyboardMode,
  actions,
  accessibleName,
  renderSelection,
  onSelect,
  onFocus,
  onKeyDown,
  onActionSelect,
  setItemRef,
  highlightState,
  interactionProps,
  children,
}: {
  item: TItem;
  slot: string;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  actions?: readonly DiagramItemAction<TItem>[];
  accessibleName?: string;
  renderSelection?: (item: TItem) => React.ReactNode;
  onSelect?: (item: TItem) => void;
  onFocus: (item: TItem) => void;
  onKeyDown: (event: React.KeyboardEvent<SVGGElement>, item: TItem) => void;
  onActionSelect?: (action: DiagramItemAction<TItem>, item: TItem) => void;
  setItemRef: (itemId: string, element: SVGGElement | null) => void;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
  children: React.ReactNode;
}) {
  const resolvedActions = actions ?? [];
  const resolvedAccessibleName = accessibleName ?? getReactNodeAccessibleName(item.label, item.id);
  const role = onSelect && resolvedActions.length === 0 ? "button" : undefined;

  return (
    <g
      data-slot={`${slot}-interaction`}
      data-item-id={item.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-highlight-state={highlightState}
      role={role}
      aria-label={role ? resolvedAccessibleName : undefined}
      aria-pressed={role ? selected : undefined}
      aria-disabled={role ? disabled || undefined : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={[
        "outline-none",
        onSelect ? `cursor-pointer focus-visible:[&_[data-slot='${slot}-focus']]:stroke-ring` : "",
        disabled ? "opacity-60" : "",
        "transition-opacity data-[highlight-state=related]:opacity-100 data-[disabled=true]:data-[highlight-state=related]:opacity-60 data-[highlight-state=dimmed]:opacity-25 data-[highlight-state=active]:[&_[data-slot$='-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot$='-node']>div]:ring-ring/60 data-[highlight-state=active]:[&_[data-slot$='-summary-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot$='-summary-node']>div]:ring-ring/60",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect && !disabled ? () => onSelect(item) : undefined}
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={(event) => {
        interactionProps?.onFocus?.(event);
        onFocus(item);
      }}
      onBlur={interactionProps?.onBlur}
      onKeyDown={(event) => {
        interactionProps?.onKeyDown?.(event);
        onKeyDown(event, item);
      }}
      ref={(element) => setItemRef(item.id, element)}
    >
      {selected ? (
        (renderSelection?.(item) ?? (
          <rect
            data-slot={`${slot}-focus`}
            x={item.x - 6}
            y={item.y - 6}
            width={item.width + 12}
            height={item.height + 12}
            rx="12"
            className="fill-transparent stroke-primary stroke-2"
          />
        ))
      ) : focused ? (
        <rect
          data-slot={`${slot}-focus`}
          x={item.x - 6}
          y={item.y - 6}
          width={item.width + 12}
          height={item.height + 12}
          rx="12"
          className="fill-transparent stroke-ring stroke-2"
        />
      ) : null}
      {children}
      {resolvedActions.length ? (
        <DiagramSvgItemActions
          actions={resolvedActions}
          item={item}
          slot={slot}
          onActionSelect={onActionSelect}
        />
      ) : null}
    </g>
  );
}

function DiagramSvgItemActions<TItem extends { id: string }>({
  actions,
  item,
  slot,
  onActionSelect,
}: {
  actions: readonly DiagramItemAction<TItem>[];
  item: TItem & Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  slot: string;
  onActionSelect?: (action: DiagramItemAction<TItem>, item: TItem) => void;
}) {
  const actionSize = 28;
  const actionGap = 4;
  const width = actions.length * actionSize + Math.max(0, actions.length - 1) * actionGap;

  return (
    <foreignObject
      data-slot={`${slot}-actions`}
      x={item.x + item.width - width - 8}
      y={item.y + item.height - actionSize - 8}
      width={width}
      height={actionSize}
    >
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot={`${slot}-action`}
            data-action-id={action.id}
            data-destructive={action.destructive ? "true" : undefined}
            aria-label={getReactNodeAccessibleName(action.label, action.id)}
            disabled={action.disabled}
            className={[
              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium text-foreground shadow-sm outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              action.destructive
                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "",
              "[&_svg]:size-3.5",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect?.(item);
              onActionSelect?.(action, item);
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </foreignObject>
  );
}

function getReactNodeAccessibleName(value: React.ReactNode, fallback: string) {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
