import { normalizeTileCount } from "../../utils.js";

export const getTopMostObjectAt = (objects, layer, row, col) => {
  const arr = objects[layer] || [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const object = arr[i];
    const heightTiles = normalizeTileCount(object.hTiles);
    const widthTiles = normalizeTileCount(object.wTiles);
    const inside =
      row >= object.row &&
      row < object.row + heightTiles &&
      col >= object.col &&
      col < object.col + widthTiles;
    if (inside) return object;
  }
  return null;
};

export const getTopMostTokenAt = (tokens, row, col) => {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const inside =
      row >= token.row &&
      row < token.row + (token.hTiles || 1) &&
      col >= token.col &&
      col < token.col + (token.wTiles || 1);
    if (inside) return token;
  }
  return null;
};
