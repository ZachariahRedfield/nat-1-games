import { clamp } from "../../../utils.js";
import { computeGridPosition, getPointerCssPosition } from "../gridPointerUtils.js";

export function handleSelectionMovement({ event, refs, selection, config, geometry, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current) return false;

  const pointer = getPointerCssPosition(event);
  const position = computeGridPosition({
    xCss: pointer.xCss,
    yCss: pointer.yCss,
    geometry,
    gridSettings: config.gridSettings,
  });

  const row = position.row;
  const col = position.col;

  if (dragRef.current.kind === "object" && selection.selectedObjId && selection.selectedObjIds.length <= 1) {
    const obj = selection.getObjectById(config.currentLayer, selection.selectedObjId);
    if (!obj) return true;
    const { offsetRow, offsetCol } = dragRef.current;
    const newRow = clamp(row - offsetRow, 0, Math.max(0, geometry.rows - obj.hTiles));
    const newCol = clamp(col - offsetCol, 0, Math.max(0, geometry.cols - obj.wTiles));
    actions.moveObject(config.currentLayer, obj.id, newRow, newCol);
    return true;
  }

  if (dragRef.current.kind === "token" && selection.selectedTokenId && selection.selectedTokenIds.length <= 1) {
    const tok = selection.getTokenById(selection.selectedTokenId);
    if (!tok) return true;
    const { offsetRow, offsetCol } = dragRef.current;
    const width = tok.wTiles || 1;
    const height = tok.hTiles || 1;
    const newRow = clamp(row - offsetRow, 0, Math.max(0, geometry.rows - height));
    const newCol = clamp(col - offsetCol, 0, Math.max(0, geometry.cols - width));
    actions.moveToken?.(tok.id, newRow, newCol);
    return true;
  }

  if (dragRef.current.kind === "marquee-obj" || dragRef.current.kind === "marquee-token") {
    dragRef.current.curRow = row;
    dragRef.current.curCol = col;
    return true;
  }

  return false;
}
