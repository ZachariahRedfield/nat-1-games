import { clamp } from "../../../utils.js";
import { computeGridPosition, getPointerCssPosition } from "../gridPointerUtils.js";

export function handleSelectionMovement({
  event,
  refs,
  selection,
  config,
  geometry,
  actions,
  setSelectionDragging,
}) {
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
    const { startRow, startCol, baseRow, baseCol, height, width } = dragRef.current;
    const deltaRow = row - startRow;
    const deltaCol = col - startCol;

    const objHeight = height ?? 1;
    const objWidth = width ?? 1;

    const minRowShift = -baseRow;
    const maxRowShift = geometry.rows - (baseRow + objHeight);
    const minColShift = -baseCol;
    const maxColShift = geometry.cols - (baseCol + objWidth);

    const clampedRowShift = clamp(deltaRow, minRowShift, maxRowShift);
    const clampedColShift = clamp(deltaCol, minColShift, maxColShift);

    const newRow = baseRow + clampedRowShift;
    const newCol = baseCol + clampedColShift;
    if (dragRef.current.lastRow === newRow && dragRef.current.lastCol === newCol) {
      return true;
    }
    actions.moveObject(config.currentLayer, dragRef.current.id, newRow, newCol);
    dragRef.current.lastRow = newRow;
    dragRef.current.lastCol = newCol;
    setSelectionDragging?.(true);
    return true;
  }

  if (dragRef.current.kind === "multi-object") {
    const { startRow, startCol, bounds, offsets } = dragRef.current;
    const deltaRow = row - startRow;
    const deltaCol = col - startCol;

    const minRowShift = -bounds.minRow;
    const maxRowShift = geometry.rows - bounds.maxRow;
    const minColShift = -bounds.minCol;
    const maxColShift = geometry.cols - bounds.maxCol;

    const clampedRowShift = clamp(deltaRow, minRowShift, maxRowShift);
    const clampedColShift = clamp(deltaCol, minColShift, maxColShift);

    if (
      dragRef.current.lastRowShift === clampedRowShift &&
      dragRef.current.lastColShift === clampedColShift
    ) {
      return true;
    }

    for (const offset of offsets) {
      const baseRow = startRow - offset.offsetRow;
      const baseCol = startCol - offset.offsetCol;
      const newRow = baseRow + clampedRowShift;
      const newCol = baseCol + clampedColShift;
      actions.moveObject(config.currentLayer, offset.id, newRow, newCol);
    }

    dragRef.current.lastRowShift = clampedRowShift;
    dragRef.current.lastColShift = clampedColShift;
    setSelectionDragging?.(true);
    return true;
  }

  if (dragRef.current.kind === "token" && selection.selectedTokenId && selection.selectedTokenIds.length <= 1) {
    const { startRow, startCol, baseRow, baseCol, height, width } = dragRef.current;
    const deltaRow = row - startRow;
    const deltaCol = col - startCol;
    const nextHeight = height ?? 1;
    const nextWidth = width ?? 1;
    const newRow = clamp(baseRow + deltaRow, 0, Math.max(0, geometry.rows - nextHeight));
    const newCol = clamp(baseCol + deltaCol, 0, Math.max(0, geometry.cols - nextWidth));
    if (dragRef.current.lastRow === newRow && dragRef.current.lastCol === newCol) {
      return true;
    }
    actions.moveToken?.(dragRef.current.id, newRow, newCol);
    dragRef.current.lastRow = newRow;
    dragRef.current.lastCol = newCol;
    setSelectionDragging?.(true);
    return true;
  }

  if (dragRef.current.kind === "marquee-obj" || dragRef.current.kind === "marquee-token") {
    dragRef.current.curRow = row;
    dragRef.current.curCol = col;
    return true;
  }

  return false;
}
