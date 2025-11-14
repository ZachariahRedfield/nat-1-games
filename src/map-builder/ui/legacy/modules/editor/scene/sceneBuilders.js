import { createDefaultLayers, makeGrid } from "../../../utils.js";

const normalizeLayerIds = (layers) => {
  if (!layers || !layers.length) {
    return createDefaultLayers().map((layer) => layer.id);
  }
  return layers.map((layer) => (typeof layer === "string" ? layer : layer.id)).filter(Boolean);
};

export function buildLayerMaps(layers, rows, cols) {
  const ids = normalizeLayerIds(layers);
  return ids.reduce((acc, id) => {
    acc[id] = makeGrid(rows, cols);
    return acc;
  }, {});
}

export function buildEmptyObjects(layers) {
  const ids = normalizeLayerIds(layers);
  return ids.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});
}

export default {
  buildLayerMaps,
  buildEmptyObjects,
};
