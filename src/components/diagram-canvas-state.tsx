"use client";

import * as React from "react";

export const diagramCanvasLabelVisibilityClass =
  "[&[data-show-labels='false']_[data-diagram-label]]:pointer-events-none [&[data-show-labels='false']_[data-diagram-label]]:opacity-0 [&[data-show-labels='false']_[data-diagram-label]]:transition-opacity [&[data-show-labels='false']_[data-diagram-edge]:hover_[data-diagram-label]]:opacity-100 [&[data-show-labels='false']_[data-diagram-edge]:focus-within_[data-diagram-label]]:opacity-100";

export function useDiagramCanvasSettings({
  defaultShowLabels = true,
}: {
  defaultShowLabels?: boolean;
} = {}) {
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [showLabels, setShowLabels] = React.useState(defaultShowLabels);
  const [menuPosition, setMenuPosition] = React.useState<{ x: number; y: number } | null>(null);
  const setScrollAreaElement = React.useCallback((element: HTMLDivElement | null) => {
    scrollAreaRef.current = element;
  }, []);

  React.useEffect(() => {
    if (!menuPosition) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) {
        return;
      }

      setMenuPosition(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuPosition]);

  const handleCanvasContextMenu = React.useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest("button,a,input,select,textarea,[role='button']")
    ) {
      return;
    }

    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    event.preventDefault();

    const scrollAreaRect = scrollArea.getBoundingClientRect();

    setMenuPosition({
      x: event.clientX - scrollAreaRect.left + scrollArea.scrollLeft,
      y: event.clientY - scrollAreaRect.top + scrollArea.scrollTop,
    });
  }, []);

  const menu = menuPosition ? (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label="Diagram settings"
      data-slot="diagram-canvas-settings-menu"
      className="absolute z-20 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: menuPosition.x, top: menuPosition.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Settings</div>
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={showLabels}
        data-slot="diagram-canvas-settings-labels"
        className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
        onClick={() => setShowLabels((current) => !current)}
      >
        <span>Labels</span>
        <span className="text-xs text-muted-foreground">{showLabels ? "On" : "Off"}</span>
      </button>
    </div>
  ) : null;

  return {
    menu,
    setScrollAreaElement,
    showLabels,
    svgProps: {
      "data-show-labels": showLabels ? "true" : "false",
      onContextMenu: handleCanvasContextMenu,
    },
  } as const;
}
