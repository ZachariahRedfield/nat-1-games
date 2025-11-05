import { describe, it, expect } from "vitest";
import { MapProjectSchema, safeParseMapProject } from "../schemas/mapProjectSchema";

const makeLayer = (value) => [
  [value, value],
  [value, value],
];

describe("MapProjectSchema", () => {
  it("parses a valid project snapshot", () => {
    const input = {
      version: 1,
      name: "Dungeon",
      rows: 2,
      cols: 2,
      tileSize: 32,
      maps: {
        background: makeLayer(null),
        base: makeLayer(1),
        sky: makeLayer(0),
      },
      objects: {
        background: [{ id: "o1", assetId: "a1", row: 0, col: 0, wTiles: 1, hTiles: 1 }],
        base: [],
        sky: [],
      },
      tokens: [{ id: "t1", assetId: "tok", row: 1, col: 1 }],
      assets: [{ id: "a1", name: "Floor", kind: "image", defaultEngine: "grid" }],
      settings: { fog: false },
    };

    const result = MapProjectSchema.parse(input);
    expect(result.maps.background).toEqual(makeLayer(null));
    expect(result.tokens[0].wTiles).toBe(1);
  });

  it("rejects grids with inconsistent row lengths", () => {
    const invalid = {
      rows: 2,
      cols: 2,
      tileSize: 32,
      maps: {
        background: [[0], [0, 1]],
        base: makeLayer(0),
        sky: makeLayer(0),
      },
      objects: { background: [], base: [], sky: [] },
      tokens: [],
      assets: [],
      settings: {},
    };

    const result = safeParseMapProject(invalid);
    expect(result.success).toBe(false);
  });
});
