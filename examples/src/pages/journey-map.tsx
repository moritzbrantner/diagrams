import { JourneyMap } from "@moritzbrantner/diagrams/journey-map";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("journey-map");

const phases = [
  { id: "discover-phase", label: "Discover", description: "Find the package" },
  { id: "adopt-phase", label: "Adopt", description: "Wire examples", tone: "accent" },
  { id: "ship-phase", label: "Ship", description: "Publish release" },
] satisfies ComponentProps<typeof JourneyMap>["phases"];

const touchpoints = [
  {
    id: "docs-touch",
    phaseId: "discover-phase",
    label: "Read docs",
    sentiment: "positive",
    owner: "Developer",
  },
  {
    id: "api-touch",
    phaseId: "adopt-phase",
    label: "Model data",
    sentiment: "neutral",
    owner: "Developer",
  },
  {
    id: "verify-touch",
    phaseId: "ship-phase",
    label: "Run verify",
    sentiment: "positive",
    owner: "Maintainer",
  },
] satisfies ComponentProps<typeof JourneyMap>["touchpoints"];

renderDiagramPage(
  <DiagramPageShell page={page}>
    <JourneyMap ariaLabel={page.ariaLabel} phases={phases} touchpoints={touchpoints} />
  </DiagramPageShell>,
);
