// Small utilities used by MapBuilder

export const LAYERS = ["background", "base", "sky"];

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const deepCopyGrid = (g) => g.map((row) => [...row]);
export const deepCopyObjects = (arr) => arr.map((o) => ({ ...o }));

export const makeGrid = (rows, cols, fill = null) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

