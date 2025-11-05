const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value));

export const createGrid = (rows, cols, fill = null) => {
  const safeRows = clampNumber(Math.floor(rows ?? 0), 1, 2048);
  const safeCols = clampNumber(Math.floor(cols ?? 0), 1, 2048);
  return Array.from({ length: safeRows }, () => Array.from({ length: safeCols }, () => fill));
};

const cloneGridSection = (grid, startRow, startCol, size) => {
  const out = [];
  for (let r = startRow; r < Math.min(startRow + size, grid.length); r += 1) {
    const row = grid[r];
    if (!Array.isArray(row)) continue;
    out.push(row.slice(startCol, startCol + size));
  }
  return out;
};

export const chunkGrid = (grid, { chunkSize = 16 } = {}) => {
  if (!Array.isArray(grid) || !grid.length) return [];
  const size = clampNumber(Math.floor(chunkSize || 1), 1, 128);
  const rows = grid.length;
  const cols = Array.isArray(grid[0]) ? grid[0].length : 0;
  const chunks = [];
  for (let row = 0; row < rows; row += size) {
    for (let col = 0; col < cols; col += size) {
      const section = cloneGridSection(grid, row, col, size);
      chunks.push({
        key: `${row}:${col}`,
        row,
        col,
        data: section,
      });
    }
  }
  return chunks;
};

export const mergeChunks = (chunks, rows, cols, fill = null) => {
  const grid = createGrid(rows, cols, fill);
  for (const chunk of chunks || []) {
    const { row, col, data } = chunk || {};
    if (!Array.isArray(data)) continue;
    for (let r = 0; r < data.length; r += 1) {
      const targetRow = row + r;
      if (!grid[targetRow]) continue;
      const rowData = data[r];
      if (!Array.isArray(rowData)) continue;
      for (let c = 0; c < rowData.length; c += 1) {
        const targetCol = col + c;
        if (grid[targetRow][targetCol] === undefined) continue;
        grid[targetRow][targetCol] = rowData[c];
      }
    }
  }
  return grid;
};

export const diffChunks = (prevChunks, nextChunks) => {
  const prevMap = new Map((prevChunks || []).map((chunk) => [chunk?.key, chunk]));
  const diff = new Set();
  for (const chunk of nextChunks || []) {
    if (!chunk || !chunk.key) continue;
    const prev = prevMap.get(chunk.key);
    const same = prev && JSON.stringify(prev.data) === JSON.stringify(chunk.data);
    if (!same) diff.add(chunk.key);
    prevMap.delete(chunk.key);
  }
  for (const key of prevMap.keys()) {
    diff.add(key);
  }
  return Array.from(diff.values()).sort();
};
