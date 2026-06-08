"use client";

import * as React from "react";

import { cn } from "@moritzbrantner/ui";

import { useDiagramZoomControls } from "./diagram-utils";

type ProcessMapOrientation = "horizontal" | "vertical";
type ProcessMapTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";
type ProcessMapStatus = "pending" | "active" | "done" | "blocked" | "warning";

type ProcessMapStepAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (step: ProcessMapStepData) => void;
};

type ProcessMapStepData = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  status?: ProcessMapStatus;
  tone?: ProcessMapTone;
  icon?: React.ComponentType<{ className?: string }>;
};

type ProcessMapProps = React.ComponentProps<"div"> & {
  steps?: readonly ProcessMapStepData[];
  orientation?: ProcessMapOrientation;
  selectedStepId?: string | null;
  focusedStepId?: string | null;
  defaultFocusedStepId?: string | null;
  keyboardMode?: "nodes" | "none";
  getStepDisabled?: (step: ProcessMapStepData) => boolean;
  stepActions?:
    | readonly ProcessMapStepAction[]
    | ((step: ProcessMapStepData) => readonly ProcessMapStepAction[]);
  onStepSelect?: (step: ProcessMapStepData) => void;
  onStepDeselect?: () => void;
  onFocusedStepIdChange?: (step: ProcessMapStepData | null) => void;
  onStepActionSelect?: (action: ProcessMapStepAction, step: ProcessMapStepData) => void;
};

export type ProcessMapStepProps = React.ComponentProps<"div"> & {
  step?: ProcessMapStepData;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
  actions?: readonly ProcessMapStepAction[];
  onActionSelect?: (action: ProcessMapStepAction, step: ProcessMapStepData) => void;
};

export type ProcessMapConnectorProps = React.ComponentProps<"div"> & {
  orientation?: ProcessMapOrientation;
};

const toneClasses: Record<ProcessMapTone, string> = {
  default: "border-border bg-card",
  accent: "border-primary/40 bg-primary/5",
  success: "border-emerald-500/40 bg-emerald-500/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  danger: "border-destructive/40 bg-destructive/10",
  muted: "border-border bg-muted/50",
};

function ProcessMap({
  steps,
  orientation = "horizontal",
  selectedStepId,
  focusedStepId,
  defaultFocusedStepId,
  keyboardMode,
  getStepDisabled,
  stepActions,
  onStepSelect,
  onStepDeselect,
  onFocusedStepIdChange,
  onStepActionSelect,
  children,
  className,
  ...props
}: ProcessMapProps) {
  const isDataDriven = Boolean(steps?.length);
  const resolvedKeyboardMode = keyboardMode ?? (onStepSelect || stepActions ? "nodes" : "none");
  const stepRefs = React.useRef(new Map<string, HTMLDivElement>());
  const enabledSteps = React.useMemo(
    () => (steps ?? []).filter((step) => !getStepDisabled?.(step)),
    [getStepDisabled, steps],
  );
  const [internalFocusedStepId, setInternalFocusedStepId] = React.useState<string | null>(
    () => defaultFocusedStepId ?? null,
  );
  const requestedFocusedStepId =
    focusedStepId !== undefined ? focusedStepId : internalFocusedStepId;
  const effectiveFocusedStepId =
    resolvedKeyboardMode === "nodes"
      ? (enabledSteps.find((step) => step.id === requestedFocusedStepId)?.id ??
        enabledSteps[0]?.id ??
        null)
      : null;
  const focusStepById = React.useCallback(
    (stepId: string | null) => {
      const nextStep = stepId ? ((steps ?? []).find((step) => step.id === stepId) ?? null) : null;

      if (focusedStepId === undefined) {
        setInternalFocusedStepId(stepId);
      }

      onFocusedStepIdChange?.(nextStep);

      if (stepId) {
        queueMicrotask(() => stepRefs.current.get(stepId)?.focus());
      }
    },
    [focusedStepId, onFocusedStepIdChange, steps],
  );
  const handleStepKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, step: ProcessMapStepData) => {
      if (resolvedKeyboardMode === "none" || getStepDisabled?.(step)) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onStepSelect?.(step);
        return;
      }

      if (event.key === "Escape") {
        if (selectedStepId != null && onStepDeselect) {
          event.preventDefault();
          onStepDeselect();
        }
        return;
      }

      const currentIndex = enabledSteps.findIndex((item) => item.id === step.id);
      const forwardKeys =
        orientation === "vertical" ? ["ArrowDown", "ArrowRight"] : ["ArrowRight", "ArrowDown"];
      const backwardKeys =
        orientation === "vertical" ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft", "ArrowUp"];

      if (forwardKeys.includes(event.key)) {
        event.preventDefault();
        focusStepById(
          enabledSteps[Math.min(enabledSteps.length - 1, currentIndex + 1)]?.id ?? null,
        );
      } else if (backwardKeys.includes(event.key)) {
        event.preventDefault();
        focusStepById(enabledSteps[Math.max(0, currentIndex - 1)]?.id ?? null);
      }
    },
    [
      enabledSteps,
      focusStepById,
      getStepDisabled,
      onStepDeselect,
      onStepSelect,
      orientation,
      resolvedKeyboardMode,
      selectedStepId,
    ],
  );
  const { controls: zoomControls, zoomStyle } = useDiagramZoomControls();

  return (
    <div
      data-slot="process-map"
      data-orientation={orientation}
      role={isDataDriven ? "list" : props.role}
      className={cn(
        "relative w-full max-w-full min-w-0 overflow-auto rounded-md border bg-card/60 p-3 text-card-foreground",
        className,
      )}
      {...props}
    >
      {zoomControls}
      <div
        data-slot="process-map-track"
        className={cn(
          "flex min-w-0 gap-3",
          orientation === "vertical"
            ? "flex-col"
            : "min-w-max flex-col md:flex-row md:items-stretch",
        )}
        style={zoomStyle}
      >
        {isDataDriven
          ? steps?.map((step, index) => (
              <React.Fragment key={step.id}>
                <ProcessMapStep
                  step={step}
                  role={onStepSelect ? "button" : "listitem"}
                  aria-pressed={onStepSelect ? selectedStepId === step.id : undefined}
                  aria-disabled={getStepDisabled?.(step) || undefined}
                  selected={selectedStepId === step.id}
                  focused={effectiveFocusedStepId === step.id}
                  disabled={Boolean(getStepDisabled?.(step))}
                  actions={
                    typeof stepActions === "function" ? stepActions(step) : (stepActions ?? [])
                  }
                  tabIndex={
                    resolvedKeyboardMode === "nodes" &&
                    effectiveFocusedStepId === step.id &&
                    !getStepDisabled?.(step)
                      ? 0
                      : -1
                  }
                  onFocus={() => {
                    if (focusedStepId === undefined) {
                      setInternalFocusedStepId(step.id);
                    }
                    onFocusedStepIdChange?.(step);
                  }}
                  onKeyDown={(event) => handleStepKeyDown(event, step)}
                  onClick={
                    onStepSelect && !getStepDisabled?.(step) ? () => onStepSelect(step) : undefined
                  }
                  onActionSelect={onStepActionSelect}
                  ref={(element) => {
                    if (element) {
                      stepRefs.current.set(step.id, element);
                    } else {
                      stepRefs.current.delete(step.id);
                    }
                  }}
                />
                {index < steps.length - 1 ? (
                  <ProcessMapConnector orientation={orientation} />
                ) : null}
              </React.Fragment>
            ))
          : children}
      </div>
    </div>
  );
}

function ProcessMapStep({
  step,
  selected,
  focused,
  disabled,
  actions = [],
  onActionSelect,
  children,
  className,
  ...props
}: ProcessMapStepProps) {
  const Icon = step?.icon;
  const tone = step?.tone ?? "default";

  return (
    <div
      data-slot="process-map-step"
      data-status={step?.status}
      data-tone={tone}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "grid min-h-28 w-full min-w-0 gap-2 rounded-md border p-4 outline-none md:w-56 md:min-w-56",
        toneClasses[tone],
        selected && "ring-2 ring-primary",
        focused && !selected && "ring-2 ring-ring/70",
        disabled && "opacity-60",
        className,
      )}
      {...props}
    >
      {step ? (
        <>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div data-slot="process-map-step-label" className="font-medium leading-5">
              {step.label}
            </div>
            {Icon ? (
              <Icon
                data-slot="process-map-step-icon"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
            ) : null}
            {actions.length ? (
              <div className="flex shrink-0 gap-1">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-slot="process-map-step-action"
                    data-action-id={action.id}
                    disabled={action.disabled}
                    aria-label={getAccessibleName(action.label, action.id)}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                      action.destructive && "text-destructive",
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      action.onSelect?.(step);
                      onActionSelect?.(action, step);
                    }}
                  >
                    {action.icon ?? action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {step.description ? (
            <div
              data-slot="process-map-step-description"
              className="text-sm leading-5 text-muted-foreground"
            >
              {step.description}
            </div>
          ) : null}
          {step.meta ? (
            <div
              data-slot="process-map-step-meta"
              className="mt-auto text-xs font-medium text-muted-foreground"
            >
              {step.meta}
            </div>
          ) : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

function getAccessibleName(value: React.ReactNode, fallback: string) {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function ProcessMapConnector({
  orientation = "horizontal",
  className,
  ...props
}: ProcessMapConnectorProps) {
  return (
    <div
      data-slot="process-map-connector"
      data-orientation={orientation}
      aria-hidden="true"
      className={cn(
        "shrink-0 self-center bg-border",
        orientation === "vertical" ? "h-8 w-px" : "h-px w-8 md:h-px md:w-10",
        className,
      )}
      {...props}
    />
  );
}

export { ProcessMap, ProcessMapStep, ProcessMapConnector };
export type {
  ProcessMapProps,
  ProcessMapStepData,
  ProcessMapOrientation,
  ProcessMapStatus,
  ProcessMapStepAction,
  ProcessMapTone,
};
