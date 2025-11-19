import { useMemo } from "react";
import { BASE_TILE } from "../../utils.js";

export const DEFAULT_LAYER_VISIBILITY = {};

function deriveLayerIds(layers) {
  return (layers || [])
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);
}

function deriveCurrentLayer({ layerIds, maps, currentLayerProp }) {
  const fallbackLayer = layerIds[0] ?? Object.keys(maps || {})[0] ?? null;
  return currentLayerProp ?? fallbackLayer;
}

function deriveLayerVisibility({ layerIds, layerVisibilityProp }) {
  return layerIds.reduce((acc, id) => {
    acc[id] = layerVisibilityProp?.[id] !== false;
    return acc;
  }, {});
}

function deriveDimensions({ maps, currentLayer, tileSize }) {
  const rows = currentLayer && maps?.[currentLayer] ? maps[currentLayer].length : 0;
  const cols = currentLayer && maps?.[currentLayer]?.[0] ? maps[currentLayer][0].length : 0;
  const cssWidth = cols * tileSize;
  const cssHeight = rows * tileSize;
  const bufferWidth = cols * BASE_TILE;
  const bufferHeight = rows * BASE_TILE;
  return { rows, cols, cssWidth, cssHeight, bufferWidth, bufferHeight };
}

export function useGridGeometry({
  layers = [],
  maps = {},
  currentLayer: currentLayerProp,
  layerVisibility: layerVisibilityProp = DEFAULT_LAYER_VISIBILITY,
  tileSize,
}) {
  return useMemo(() => {
    const layerIds = deriveLayerIds(layers);
    const currentLayer = deriveCurrentLayer({ layerIds, maps, currentLayerProp });
    const layerVisibility = deriveLayerVisibility({ layerIds, layerVisibilityProp });
    const { rows, cols, cssWidth, cssHeight, bufferWidth, bufferHeight } = deriveDimensions({
      maps,
      currentLayer,
      tileSize,
    });
    const layerIsVisible = currentLayer ? layerVisibility?.[currentLayer] !== false : false;

    return {
      layerIds,
      currentLayer,
      rows,
      cols,
      cssWidth,
      cssHeight,
      bufferWidth,
      bufferHeight,
      layerVisibility,
      layerIsVisible,
    };
  }, [layers, maps, currentLayerProp, layerVisibilityProp, tileSize]);
}

export default useGridGeometry;
