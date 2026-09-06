"use client";

import * as React from "react";

import {
  getDiagramComputeRuntime,
  getDiagramComputeRuntimeVersion,
  subscribeDiagramComputeRuntime,
} from "../layout";

export function useDiagramComputeRuntime() {
  React.useSyncExternalStore(
    subscribeDiagramComputeRuntime,
    getDiagramComputeRuntimeVersion,
    () => 0,
  );

  return getDiagramComputeRuntime();
}
