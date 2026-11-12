import type { DiagramTone } from "../diagram-types";

export const defaultToneClasses: Record<DiagramTone, string> = {
  default: "border-border bg-background",
  accent: "border-primary/40 bg-primary/5",
  success: "border-emerald-500/40 bg-emerald-500/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  danger: "border-destructive/40 bg-destructive/10",
  muted: "border-border bg-muted/60",
};

export const defaultSvgToneClasses: Record<DiagramTone, string> = {
  default: "fill-background stroke-border",
  accent: "fill-primary/5 stroke-primary/40",
  success: "fill-emerald-500/10 stroke-emerald-500/40",
  warning: "fill-amber-500/10 stroke-amber-500/50",
  danger: "fill-destructive/10 stroke-destructive/40",
  muted: "fill-muted/60 stroke-border",
};

export const defaultEdgeToneClasses: Record<DiagramTone, string> = {
  default: "stroke-muted-foreground",
  accent: "stroke-primary",
  success: "stroke-emerald-600 dark:stroke-emerald-400",
  warning: "stroke-amber-600 dark:stroke-amber-400",
  danger: "stroke-destructive",
  muted: "stroke-border",
};
