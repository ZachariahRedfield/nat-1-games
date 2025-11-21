export function beginGridBrush({
  row,
  col,
  config,
  state,
  refs,
  actions,
  callbacks,
  getTopMostObjectAt,
}) {
  const { selectedAsset, assetGroup, isErasing, canvasColor, currentLayer } = config;
  const { setIsBrushing } = state;
  const { lastTileRef } = refs;
  const { placeGridImageAt, placeGridColorStampAt, eraseGridStampAt, placeTokenAt } = actions;
  const { onBeginTileStroke, onBeginObjectStroke, onBeginTokenStroke } = callbacks;
  setIsBrushing(true);
  if (lastTileRef) lastTileRef.current = { row: -1, col: -1 };

  const hitObj = getTopMostObjectAt(currentLayer, row, col);

  if ((selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") && assetGroup === "token") {
    onBeginTokenStroke?.();
    placeTokenAt(row, col);
    return true;
  }

  if (isErasing) {
    if (hitObj) onBeginObjectStroke?.(currentLayer);
    else onBeginTileStroke?.(currentLayer);
    eraseGridStampAt(Math.floor(row), Math.floor(col));
    return true;
  }

  if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
    onBeginObjectStroke?.(currentLayer);
    placeGridImageAt(row, col);
    return true;
  }

  if (selectedAsset?.kind === "color" && canvasColor) {
    onBeginTileStroke?.(currentLayer);
    placeGridColorStampAt(row, col);
    return true;
  }

  return true;
}
