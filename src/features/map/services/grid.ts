export type TileValue = string | null;
export type TileRow = TileValue[];
export type TileGrid = TileRow[];

export interface GridDimensions {
  rows: number;
  cols: number;
}

export const DEFAULT_DIMENSIONS: GridDimensions = { rows: 30, cols: 30 };

export function createGrid({ rows, cols }: GridDimensions, fill: TileValue = null): TileGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function cloneGrid(grid: TileGrid): TileGrid {
  return grid.map((row) => [...row]);
}

export function resizeGrid(grid: TileGrid, { rows, cols }: GridDimensions, fill: TileValue = null): TileGrid {
  const next = createGrid({ rows, cols }, fill);
  const copyRows = Math.min(rows, grid.length);
  const copyCols = Math.min(cols, grid[0]?.length ?? 0);

  for (let r = 0; r < copyRows; r += 1) {
    for (let c = 0; c < copyCols; c += 1) {
      next[r][c] = grid[r][c];
    }
  }

  return next;
}

export function mutateTile(grid: TileGrid, row: number, col: number, value: TileValue) {
  if (!grid[row]) return;
  grid[row][col] = value;
}

export function iterateGrid(grid: TileGrid, callback: (value: TileValue, row: number, col: number) => void) {
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r];
    for (let c = 0; c < row.length; c += 1) {
      callback(row[c], r, c);
    }
  }
}
