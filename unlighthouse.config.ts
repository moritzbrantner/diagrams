import type { UserConfig } from "unlighthouse/config";

const diagramSlugs = [
  "architecture-diagram",
  "decision-tree",
  "dependency-graph",
  "entity-relationship-diagram",
  "gantt-chart",
  "journey-map",
  "mind-map",
  "org-chart",
  "process-map",
  "relationship-map",
  "sequence-diagram",
  "state-machine-diagram",
  "swimlane-diagram",
  "timeline-diagram",
  "uml-diagram",
];
const scannedPaths = ["/", ...diagramSlugs.map((slug) => `/${slug}/`)];

const config: UserConfig = {
  ci: {
    budget: 40,
    reporter: "jsonExpanded",
  },
  lighthouseOptions: {
    throttling: {
      cpuSlowdownMultiplier: 1,
      downloadThroughputKbps: 0,
      requestLatencyMs: 0,
      rttMs: 0,
      throughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    throttlingMethod: "provided",
  },
  puppeteerOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  scanner: {
    device: "desktop",
    include: scannedPaths,
    samples: 1,
  },
  site: "http://127.0.0.1:41736",
  urls: scannedPaths,
};

export default config;
