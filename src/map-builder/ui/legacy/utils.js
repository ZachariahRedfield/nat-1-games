// Small utilities used by MapBuilder

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const deepCopyGrid = (g) => g.map((row) => [...row]);
export const deepCopyObjects = (arr) => arr.map((o) => ({ ...o }));

export const makeGrid = (rows, cols, fill = null) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

export const createDefaultLayers = () => [
  { id: "layer-1", name: "Layer 1" },
];

export const ensureLayerName = (name, fallback) => {
  const trimmed = (name ?? "").trim();
  return trimmed.length ? trimmed : fallback;
};

export const nextLayerName = (layers = []) => {
  let max = layers.length;
  for (const layer of layers) {
    const match = /([0-9]+)$/.exec((layer.name || "").trim());
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }
  return `Layer ${max + 1}`;
};

