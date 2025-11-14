import { makeGrid } from "../../../utils.js";

export function buildLayerMaps(rows, cols) {
  return {
    background: makeGrid(rows, cols),
    base: makeGrid(rows, cols),
    sky: makeGrid(rows, cols),
  };
}

export function buildEmptyObjects() {
  return {
    background: [],
    base: [],
    sky: [],
  };
}

export default {
  buildLayerMaps,
  buildEmptyObjects,
};
