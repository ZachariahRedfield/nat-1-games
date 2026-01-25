export const getTopMostObjectAt = (objects, layer, row, col) => {
  const arr = objects[layer] || [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const object = arr[i];
    const inside =
      row >= object.row &&
      row < object.row + object.hTiles &&
      col >= object.col &&
      col < object.col + object.wTiles;
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
