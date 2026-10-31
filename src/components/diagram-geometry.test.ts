import { describe, expect, it } from "vitest";

import { getSpatialBounds } from "./diagram-geometry";

describe("getSpatialBounds", () => {
  it("covers finite items and points and skips non-finite positions", () => {
    expect(
      getSpatialBounds(
        [
          { x: 10, y: 20, width: 100, height: 50 },
          { x: Number.NaN, y: 0, width: 999, height: 999 },
        ],
        [
          { x: -5, y: 90 },
          { x: Number.POSITIVE_INFINITY, y: 0 },
        ],
      ),
    ).toEqual({ x: -5, y: 20, width: 115, height: 70 });
  });

  it("returns the fallback when nothing is finite", () => {
    const fallback = { x: 1, y: 2, width: 3, height: 4 };

    expect(getSpatialBounds([], [], fallback)).toBe(fallback);
  });

  it("handles more points than a spread call can pass as arguments", () => {
    const points = Array.from({ length: 300_000 }, (_, index) => ({ x: index, y: -index }));

    expect(getSpatialBounds([], points)).toEqual({
      x: 0,
      y: -299_999,
      width: 299_999,
      height: 299_999,
    });
  });
});
