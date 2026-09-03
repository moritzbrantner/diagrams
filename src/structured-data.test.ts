import { describe, expect, test } from "vitest";

import { createDiagramStructuredData } from "./structured-data";

describe("diagram structured data", () => {
  test("normalizes a renderer-independent node and edge representation", () => {
    expect(
      createDiagramStructuredData(
        [
          { id: " api ", label: " API ", group: " platform " },
          { id: "db", label: "Database" },
        ],
        [
          {
            id: " api-db ",
            sourceId: " api ",
            targetId: "db",
            label: " reads ",
          },
        ],
      ),
    ).toEqual({
      nodes: [
        { id: "api", label: "API", group: "platform", description: undefined },
        {
          id: "db",
          label: "Database",
          group: undefined,
          description: undefined,
        },
      ],
      edges: [
        {
          id: "api-db",
          sourceId: "api",
          targetId: "db",
          label: "reads",
          description: undefined,
        },
      ],
    });
  });

  test("rejects dangling edges", () => {
    expect(() =>
      createDiagramStructuredData([{ id: "api", label: "API" }], [
        { id: "api-db", sourceId: "api", targetId: "db" },
      ]),
    ).toThrow("unknown node");
  });
});
