import { computeGridPosition, getPointerCssPosition } from "../gridPointerUtils.js";

export function handleGridBrushMove({ event, refs, config, geometry, actions }) {
  if (config.selectedAsset?.kind === "token" || config.selectedAsset?.kind === "tokenGroup") return false;

  const pointer = getPointerCssPosition(event);
  const position = computeGridPosition({
    xCss: pointer.xCss,
    yCss: pointer.yCss,
    geometry,
    gridSettings: config.gridSettings,
  });

  const step = config.gridSettings?.snapStep ?? 1;
  const dedupeLikeSnap = !!config.gridSettings?.snapToGrid || (!config.gridSettings?.snapToGrid && step === 1);
  if (dedupeLikeSnap && refs.lastTileRef) {
    const keyRow = Math.floor(position.rowRaw);
    const keyCol = Math.floor(position.colRaw);
    const last = refs.lastTileRef.current;
    if (last && keyRow === last.row && keyCol === last.col) return true;
    refs.lastTileRef.current = { row: keyRow, col: keyCol };
  }

  if (config.isErasing) {
    actions.eraseGridStampAt(position.row, position.col);
  } else if (config.selectedAsset?.kind === "image" || config.selectedAsset?.kind === "natural") {
    actions.placeGridImageAt(position.row, position.col);
  } else {
    actions.placeGridColorStampAt(position.row, position.col);
  }

  return true;
}
