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

  if (config.isErasing) {
    actions.eraseGridStampAt(position.row, position.col);
  } else if (config.selectedAsset?.kind === "image" || config.selectedAsset?.kind === "natural") {
    actions.placeGridImageAt(position.row, position.col);
  } else {
    actions.placeGridColorStampAt(position.row, position.col);
  }

  return true;
}
