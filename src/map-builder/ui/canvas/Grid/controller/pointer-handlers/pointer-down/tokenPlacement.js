export function beginTokenPlacement({ row, col, config, callbacks, actions }) {
  const { placeTokenAt } = actions;
  const { onBeginTokenStroke } = callbacks;
  const { assetGroup, interactionMode } = config;

  if (assetGroup !== "token" || interactionMode === "select") return false;
  onBeginTokenStroke?.();
  placeTokenAt(row, col);
  return true;
}
