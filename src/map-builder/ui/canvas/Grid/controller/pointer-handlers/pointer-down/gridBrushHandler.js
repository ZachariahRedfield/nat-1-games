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
  const { gridSettings } = config;
  const { setIsBrushing } = state;
  const { lastTileRef } = refs;
  const { placeGridImageAt, placeGridColorStampAt, eraseGridStampAt, placeTokenAt } = actions;
  const { onBeginTileStroke, onBeginObjectStroke, onBeginTokenStroke } = callbacks;
  setIsBrushing(true);
  if (lastTileRef) lastTileRef.current = { row: -1, col: -1 };

  const snapToGrid = !!gridSettings?.snapToGrid;
  const centerRow = snapToGrid ? row + 0.5 : row;
  const centerCol = snapToGrid ? col + 0.5 : col;

  const hitObj = getTopMostObjectAt(currentLayer, row, col);

  if ((selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") && assetGroup === "token") {
    onBeginTokenStroke?.();
    placeTokenAt(centerRow, centerCol);
    return true;
  }

  if (isErasing) {
    if (hitObj) onBeginObjectStroke?.(currentLayer);
    else onBeginTileStroke?.(currentLayer);
    eraseGridStampAt(Math.floor(centerRow), Math.floor(centerCol));
    return true;
  }

  if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
    onBeginObjectStroke?.(currentLayer);
    placeGridImageAt(centerRow, centerCol);
    return true;
  }

  if (selectedAsset?.kind === "color" && canvasColor) {
    onBeginTileStroke?.(currentLayer);
    placeGridColorStampAt(centerRow, centerCol);
    return true;
  }

  return true;
}
