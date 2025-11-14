import { clamp } from "../../utils.js";
import { computeResizeUpdate } from "../resizeMath.js";
import { computeGridPosition, getPointerCssPosition } from "./gridPointerUtils.js";

function handleZoomDrag({ refs, event, state }) {
  const { mouseDownRef, zoomDragRef } = refs;
  if (!state || !mouseDownRef.current) return true;
  const z = zoomDragRef.current;
  if (!z) return true;
  const pointer = getPointerCssPosition(event);
  z.curCss = { x: pointer.xCss, y: pointer.yCss };
  return true;
}

function handlePan({ event, state, refs }) {
  const { lastPan, setLastPan, isPanning } = state;
  const { scrollRef } = refs;
  if (!isPanning || !lastPan || !scrollRef?.current) return false;

  const dx = event.clientX - lastPan.x;
  const dy = event.clientY - lastPan.y;
  scrollRef.current.scrollBy({ left: -dx, top: -dy });
  setLastPan({ x: event.clientX, y: event.clientY });
  return true;
}

function handleObjectResize({
  event,
  refs,
  selection,
  config,
  geometry,
  actions,
}) {
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
  });

  if (!result) return true;

  const { row, col, wTiles, hTiles } = result;
  if (row === o.row && col === o.col && wTiles === o.wTiles && hTiles === o.hTiles) {
    return true;
  }

  actions.updateObjectById(config.currentLayer, o.id, {
    row,
    col,
    wTiles,
    hTiles,
  });
  config.setGridSettings?.((settings) => ({ ...settings, sizeCols: wTiles, sizeRows: hTiles }));
  return true;
}

function handleTokenResize({ event, refs, selection, config, geometry, actions }) {
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
  });

  if (!result) return true;

  const { row, col, wTiles, hTiles } = result;
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
  return true;
}

function handleObjectRotation({ event, refs, selection, config, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "rotate-obj") return false;

  const pointer = getPointerCssPosition(event);
  const angle = Math.atan2(pointer.yCss - dragRef.current.cy, pointer.xCss - dragRef.current.cx);
  const deltaRad = angle - dragRef.current.startAngle;
  const deltaDeg = (deltaRad * 180) / Math.PI;
  const o = selection.getObjectById(config.currentLayer, dragRef.current.id);
  if (!o) return true;

  let next = (dragRef.current.startRot + deltaDeg) % 360;
  if (next < 0) next += 360;
  const rot = Math.round(next);
  actions.updateObjectById(config.currentLayer, o.id, { rotation: rot });
  config.setGridSettings?.((settings) => ({ ...settings, rotation: rot }));
  return true;
}

function handleTokenRotation({ event, refs, selection, config, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "rotate-token") return false;

  const pointer = getPointerCssPosition(event);
  const angle = Math.atan2(pointer.yCss - dragRef.current.cy, pointer.xCss - dragRef.current.cx);
  const deltaRad = angle - dragRef.current.startAngle;
  const deltaDeg = (deltaRad * 180) / Math.PI;
  const token = selection.getTokenById(dragRef.current.id);
  if (!token) return true;

  let next = (dragRef.current.startRot + deltaDeg) % 360;
  if (next < 0) next += 360;
  actions.updateTokenById?.(dragRef.current.id, { rotation: Math.round(next) });
  return true;
}

function handleSelectionMovement({
  event,
  refs,
  selection,
  config,
  geometry,
  actions,
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

function handleGridBrushMove({ event, refs, config, geometry, actions }) {
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

function handleCanvasStroke({ event, refs, config, data }) {
  if (!refs.lastStampCssRef || !refs.emaCssRef) return true;
  if (!data.paintTipAt || !data.stampBetweenCanvas) return true;
  const pointer = getPointerCssPosition(event);
  const native = event.nativeEvent;
  const events = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [native];
  const alpha = clamp(config.canvasSmoothing ?? 0.55, 0.01, 0.99);

  let last = refs.lastStampCssRef.current;
  let ema = refs.emaCssRef.current || last;

  for (const ev of events) {
    const px = ev.clientX - pointer.rect.left;
    const py = ev.clientY - pointer.rect.top;

    if (!last || !ema) {
      const init = { x: px, y: py };
      refs.lastStampCssRef.current = init;
      refs.emaCssRef.current = init;
      data.paintTipAt(init);
      continue;
    }

    ema = {
      x: ema.x + (px - ema.x) * alpha,
      y: ema.y + (py - ema.y) * alpha,
    };
    data.stampBetweenCanvas(last, ema);
    last = ema;
  }

  refs.lastStampCssRef.current = last;
  refs.emaCssRef.current = ema;
  return true;
}

export function createPointerMoveHandler(context) {
  const {
    geometry,
    refs,
    selection,
    state,
    config,
    actions,
    data,
  } = context;

  return function handlePointerMove(event) {
    const pointer = getPointerCssPosition(event);
    state.setMousePos({ x: pointer.xCss, y: pointer.yCss });

    if (config.zoomToolActive) {
      if (refs.mouseDownRef.current) handleZoomDrag({ refs, event, state });
      return;
    }

    if (handlePan({ event, state, refs })) return;

    if (!refs.mouseDownRef.current) return;
    if (!config.layerIsVisible) return;

    if (handleObjectResize({ event, refs, selection, config, geometry, actions })) return;
    if (handleTokenResize({ event, refs, selection, config, geometry, actions })) return;
    if (handleObjectRotation({ event, refs, selection, config, actions })) return;
    if (handleTokenRotation({ event, refs, selection, config, actions })) return;

    if (config.interactionMode === "select") {
      if (handleSelectionMovement({ event, refs, selection, config, geometry, actions })) return;
      return;
    }

    if (config.engine === "grid") {
      if (handleGridBrushMove({ event, refs, config, geometry, actions })) return;
    }

    if (config.engine === "canvas") {
      handleCanvasStroke({ event, refs, config, data });
    }
  };
}

export default createPointerMoveHandler;
