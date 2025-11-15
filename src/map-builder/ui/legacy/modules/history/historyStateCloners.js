import { deepCopyGrid, deepCopyObjects } from "../../utils.js";

export function copyLayerList(layers = []) {
  return layers.map((layer) => ({ ...layer }));
}

export function cloneMap(grid) {
  if (!Array.isArray(grid)) return grid;
  return deepCopyGrid(grid);
}

export function cloneObjectList(list) {
  if (!Array.isArray(list)) return list || [];
  return deepCopyObjects(list);
}

export function cloneTokenList(tokens = []) {
  return cloneObjectList(tokens);
}

export function copyMapState(maps = {}) {
  const next = {};
  Object.entries(maps || {}).forEach(([key, grid]) => {
    next[key] = cloneMap(grid);
  });
  return next;
}

export function copyObjectState(objects = {}) {
  const next = {};
  Object.entries(objects || {}).forEach(([key, list]) => {
    next[key] = cloneObjectList(list);
  });
  return next;
}

export function copyMapLayer(maps = {}, layerId) {
  return cloneMap(maps?.[layerId]);
}

export function copyObjectLayer(objects = {}, layerId) {
  return cloneObjectList(objects?.[layerId]);
}
