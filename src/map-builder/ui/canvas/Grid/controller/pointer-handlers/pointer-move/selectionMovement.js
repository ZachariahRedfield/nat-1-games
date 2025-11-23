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

  if (dragRef.current.kind === "object") {
    const obj = selection.getObjectById(config.currentLayer, dragRef.current.id);
    if (!obj) return true;
    const { offsetRow, offsetCol } = dragRef.current;
    const newRow = clamp(row - offsetRow, 0, Math.max(0, geometry.rows - obj.hTiles));
    const newCol = clamp(col - offsetCol, 0, Math.max(0, geometry.cols - obj.wTiles));
    actions.moveObject(config.currentLayer, obj.id, newRow, newCol);
    return true;
  }

  if (dragRef.current.kind === "multi-object" && selection.selectedObjIds?.length > 1) {
    const { startRow, startCol, bounds, offsets } = dragRef.current;
    const deltaRow = row - startRow;
    const deltaCol = col - startCol;

    const minRowShift = -bounds.minRow;
    const maxRowShift = geometry.rows - bounds.maxRow;
    const minColShift = -bounds.minCol;
    const maxColShift = geometry.cols - bounds.maxCol;

    const clampedRowShift = clamp(deltaRow, minRowShift, maxRowShift);
    const clampedColShift = clamp(deltaCol, minColShift, maxColShift);

    for (const offset of offsets) {
      const baseRow = startRow - offset.offsetRow;
      const baseCol = startCol - offset.offsetCol;
      const newRow = baseRow + clampedRowShift;
      const newCol = baseCol + clampedColShift;
      actions.moveObject(config.currentLayer, offset.id, newRow, newCol);
    }

    return true;
  }

  if (dragRef.current.kind === "token") {
    const tok = selection.getTokenById(dragRef.current.id);
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
