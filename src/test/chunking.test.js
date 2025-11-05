import { describe, it, expect } from "vitest";
import { chunkGrid, mergeChunks, diffChunks, createGrid } from "../engine/chunking";

describe("chunking", () => {
  it("creates deterministic chunks for a grid", () => {
    const grid = createGrid(4, 4, 0);
    grid[0][0] = 1;
    grid[1][1] = 2;
    const chunks = chunkGrid(grid, { chunkSize: 2 });

    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toMatchObject({ key: "0:0", row: 0, col: 0 });
    expect(chunks[0].data).toEqual([
      [1, 0],
      [0, 2],
    ]);
  });

  it("reconstructs the original grid from chunks", () => {
    const grid = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const chunks = chunkGrid(grid, { chunkSize: 2 });
    const merged = mergeChunks(chunks, 4, 4, 0);

    expect(merged).toEqual(grid);
  });

  it("detects changed chunks between revisions", () => {
    const grid = createGrid(4, 4, 0);
    const prev = chunkGrid(grid, { chunkSize: 2 });

    const nextGrid = mergeChunks(prev, 4, 4, 0);
    nextGrid[2][2] = 99;
    const next = chunkGrid(nextGrid, { chunkSize: 2 });

    const diff = diffChunks(prev, next);
    expect(diff).toEqual(["2:2"]);
  });
});
