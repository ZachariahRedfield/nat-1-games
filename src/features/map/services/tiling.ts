import { cloneGrid, createGrid, iterateGrid, mutateTile, type TileGrid, type TileValue } from "./grid";

export interface TileBrush {
  value: TileValue;
}

export function applyBrush(grid: TileGrid, row: number, col: number, brush: TileBrush): TileGrid {
  const next = cloneGrid(grid);
  mutateTile(next, row, col, brush.value);
  return next;
}

export function fillArea(grid: TileGrid, value: TileValue): TileGrid {
  const { length } = grid;
  if (length === 0) return grid;
  const cols = grid[0]?.length ?? 0;
  const next = createGrid({ rows: length, cols }, value);
  return next;
}

export function diffGrids(a: TileGrid, b: TileGrid) {
  const changes: Array<{ row: number; col: number; from: TileValue; to: TileValue }> = [];
  iterateGrid(a, (value, row, col) => {
    const next = b[row]?.[col];
    if (next !== value) {
      changes.push({ row, col, from: value, to: next ?? null });
    }
  });
  return changes;
}
