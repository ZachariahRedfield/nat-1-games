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
  const snapToGrid = !!config.gridSettings?.snapToGrid;
  const centerRow = snapToGrid ? position.row + 0.5 : position.row;
  const centerCol = snapToGrid ? position.col + 0.5 : position.col;
  const nextRow = Math.floor(centerRow);
  const nextCol = Math.floor(centerCol);

  if (refs?.lastTileRef?.current) {
    const last = refs.lastTileRef.current;
    if (last.row === nextRow && last.col === nextCol) {
      return true;
    }
    refs.lastTileRef.current = { row: nextRow, col: nextCol };
  }

  if (config.isErasing) {
    actions.eraseGridStampAt(nextRow, nextCol);
  } else if (config.selectedAsset?.kind === "image" || config.selectedAsset?.kind === "natural") {
    actions.placeGridImageAt(centerRow, centerCol);
  } else {
    actions.placeGridColorStampAt(centerRow, centerCol);
  }

  return true;
}
