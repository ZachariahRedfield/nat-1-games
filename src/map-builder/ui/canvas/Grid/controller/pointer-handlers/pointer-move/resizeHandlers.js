import { computeLinkedResizeUpdate, computeResizeUpdate, getCornerWorldPosition, oppositeCorner } from "../../resizeMath.js";
import { computeGridPosition, getPointerCssPosition } from "../gridPointerUtils.js";

export function handleObjectResize({ event, refs, selection, config, geometry, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "resize-obj") return false;

  const pointer = getPointerCssPosition(event);
  const position = computeGridPosition({
    xCss: pointer.xCss,
    yCss: pointer.yCss,
    geometry,
    gridSettings: config.gridSettings,
  });

  const o = selection.getObjectById(config.currentLayer, dragRef.current.id);
  if (!o) return true;

  const result = computeResizeUpdate({
    pointerRow: position.rowRaw ?? position.row,
    pointerCol: position.colRaw ?? position.col,
    anchorRow: dragRef.current.anchorRow,
    anchorCol: dragRef.current.anchorCol,
    rotation: dragRef.current.rotation ?? o.rotation ?? 0,
    signX: dragRef.current.signX,
    signY: dragRef.current.signY,
    minWidthTiles: dragRef.current.minWidthTiles ?? 1,
    minHeightTiles: dragRef.current.minHeightTiles ?? 1,
    geometry,
    snapToGrid: config.gridSettings?.snapToGrid ?? true,
  });

  if (!result) return true;

  const linkXY = config.gridSettings?.linkXY;
  const anchorCorner = oppositeCorner(dragRef.current.corner);
  const linkedResult = linkXY
    ? computeLinkedResizeUpdate({
        anchorRow: dragRef.current.anchorRow,
        anchorCol: dragRef.current.anchorCol,
        rotation: dragRef.current.rotation ?? o.rotation ?? 0,
        anchorCorner,
        sizeTiles: Math.max(result.wTiles, result.hTiles),
        geometry,
        snapToGrid: config.gridSettings?.snapToGrid ?? true,
      })
    : null;
  const { row, col, wTiles, hTiles } = linkedResult || result;
  if (row === o.row && col === o.col && wTiles === o.wTiles && hTiles === o.hTiles) {
    return true;
  }

  actions.updateObjectById(config.currentLayer, o.id, {
    row,
    col,
    wTiles,
    hTiles,
  });
  config.setGridSettings?.((settings) => {
    return { ...settings, sizeCols: wTiles, sizeRows: hTiles };
  });
  const updated = { ...o, row, col, wTiles, hTiles };
  const anchorPos = getCornerWorldPosition(updated, anchorCorner);
  dragRef.current.anchorRow = anchorPos.row;
  dragRef.current.anchorCol = anchorPos.col;
  return true;
}

export function handleTokenResize({ event, refs, selection, config, geometry, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "resize-token") return false;

  const pointer = getPointerCssPosition(event);
  const position = computeGridPosition({
    xCss: pointer.xCss,
    yCss: pointer.yCss,
    geometry,
    gridSettings: config.gridSettings,
  });

  const token = selection.getTokenById(dragRef.current.id);
  if (!token) return true;

  const result = computeResizeUpdate({
    pointerRow: position.rowRaw ?? position.row,
    pointerCol: position.colRaw ?? position.col,
    anchorRow: dragRef.current.anchorRow,
    anchorCol: dragRef.current.anchorCol,
    rotation: dragRef.current.rotation ?? token.rotation ?? 0,
    signX: dragRef.current.signX,
    signY: dragRef.current.signY,
    minWidthTiles: dragRef.current.minWidthTiles ?? 1,
    minHeightTiles: dragRef.current.minHeightTiles ?? 1,
    geometry,
    snapToGrid: config.gridSettings?.snapToGrid ?? true,
  });

  if (!result) return true;

  const linkXY = config.gridSettings?.linkXY;
  const anchorCorner = oppositeCorner(dragRef.current.corner);
  const linkedResult = linkXY
    ? computeLinkedResizeUpdate({
        anchorRow: dragRef.current.anchorRow,
        anchorCol: dragRef.current.anchorCol,
        rotation: dragRef.current.rotation ?? token.rotation ?? 0,
        anchorCorner,
        sizeTiles: Math.max(result.wTiles, result.hTiles),
        geometry,
        snapToGrid: config.gridSettings?.snapToGrid ?? true,
      })
    : null;
  const { row, col, wTiles, hTiles } = linkedResult || result;
  const existingRow = token.row ?? 0;
  const existingCol = token.col ?? 0;
  const existingW = token.wTiles || 1;
  const existingH = token.hTiles || 1;
  if (row === existingRow && col === existingCol && wTiles === existingW && hTiles === existingH) {
    return true;
  }

  actions.updateTokenById?.(dragRef.current.id, {
    row,
    col,
    wTiles,
    hTiles,
  });
  config.setGridSettings?.((settings) => {
    return { ...settings, sizeCols: wTiles, sizeRows: hTiles };
  });
  const updated = { ...token, row, col, wTiles, hTiles };
  const anchorPos = getCornerWorldPosition(updated, anchorCorner);
  dragRef.current.anchorRow = anchorPos.row;
  dragRef.current.anchorCol = anchorPos.col;
  return true;
}
