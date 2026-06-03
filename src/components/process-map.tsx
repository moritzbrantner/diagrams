"use client";

import * as React from "react";

import { cn } from "../lib/cn";

type ProcessMapOrientation = "horizontal" | "vertical";
type ProcessMapTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";
type ProcessMapStatus = "pending" | "active" | "done" | "blocked" | "warning";

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
};

export type ProcessMapStepProps = React.ComponentProps<"div"> & {
  step?: ProcessMapStepData;
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
  children,
  className,
  ...props
}: ProcessMapProps) {
  const isDataDriven = Boolean(steps?.length);

  return (
    <div
      data-slot="process-map"
      data-orientation={orientation}
      role={isDataDriven ? "list" : props.role}
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto rounded-md border bg-card/60 p-3 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="process-map-track"
        className={cn(
          "flex min-w-0 gap-3",
          orientation === "vertical"
            ? "flex-col"
            : "min-w-max flex-col md:flex-row md:items-stretch",
        )}
      >
        {isDataDriven
          ? steps?.map((step, index) => (
              <React.Fragment key={step.id}>
                <ProcessMapStep step={step} role="listitem" />
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

function ProcessMapStep({ step, children, className, ...props }: ProcessMapStepProps) {
  const Icon = step?.icon;
  const tone = step?.tone ?? "default";

  return (
    <div
      data-slot="process-map-step"
      data-status={step?.status}
      data-tone={tone}
      className={cn(
        "grid min-h-28 w-full min-w-0 gap-2 rounded-md border p-4 md:w-56 md:min-w-56",
        toneClasses[tone],
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
  ProcessMapTone,
};
