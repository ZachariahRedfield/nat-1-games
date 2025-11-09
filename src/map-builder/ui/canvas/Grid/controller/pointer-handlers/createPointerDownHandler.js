import { computeGridPosition, getPointerCssPosition } from "./gridPointerUtils.js";

function setPointerCapture(event) {
  event.target.setPointerCapture?.(event.pointerId);
}

function beginZoomDrag({ event, pointer, refs, state }) {
  const { zoomDragRef } = refs;
  const { setMousePos } = state;
  const { xCss, yCss } = pointer;

  setMousePos({ x: xCss, y: yCss });
  const isLeft = event.button === 0 || (event.buttons & 1) === 1;
  if (!isLeft) return true;

  zoomDragRef.current = {
    kind: "marquee",
    startCss: { x: xCss, y: yCss },
    curCss: { x: xCss, y: yCss },
    lastCss: { x: xCss, y: yCss },
  };
  event.preventDefault();
  setPointerCapture(event);
  return true;
}

function beginPan({ event, state }) {
  const { setIsPanning, setLastPan } = state;
  setIsPanning(true);
  setLastPan({ x: event.clientX, y: event.clientY });
  setPointerCapture(event);
  return true;
}

function beginObjectResize({ event, cornerHit, dragRef, callbacks, config }) {
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;
  const o = cornerHit.sel;
  const anchor = (() => {
    if (cornerHit.corner === "nw") return { row: o.row + o.hTiles, col: o.col + o.wTiles };
    if (cornerHit.corner === "ne") return { row: o.row + o.hTiles, col: o.col };
    if (cornerHit.corner === "sw") return { row: o.row, col: o.col + o.wTiles };
    return { row: o.row, col: o.col };
  })();

  onBeginObjectStroke?.(currentLayer);
  dragRef.current = {
    kind: "resize-obj",
    id: o.id,
    anchorRow: anchor.row,
    anchorCol: anchor.col,
    corner: cornerHit.corner,
  };
  setPointerCapture(event);
  return true;
}

function beginTokenResize({ event, tokenCorner, dragRef, callbacks }) {
  const { onBeginTokenStroke } = callbacks;
  const token = tokenCorner.sel;
  const anchorToken = (() => {
    if (tokenCorner.corner === "nw")
      return { row: token.row + (token.hTiles || 1), col: token.col + (token.wTiles || 1) };
    if (tokenCorner.corner === "ne") return { row: token.row + (token.hTiles || 1), col: token.col };
    if (tokenCorner.corner === "sw") return { row: token.row, col: token.col + (token.wTiles || 1) };
    return { row: token.row, col: token.col };
  })();

  onBeginTokenStroke?.();
  dragRef.current = {
    kind: "resize-token",
    id: token.id,
    anchorRow: anchorToken.row,
    anchorCol: anchorToken.col,
    corner: tokenCorner.corner,
  };
  setPointerCapture(event);
  return true;
}

function beginObjectRotation({ event, rotHit, dragRef, callbacks, config }) {
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;
  const o = rotHit.sel;

  onBeginObjectStroke?.(currentLayer);
  dragRef.current = {
    kind: "rotate-obj",
    id: o.id,
    cx: rotHit.cx,
    cy: rotHit.cy,
    startAngle: rotHit.startAngle,
    startRot: o.rotation || 0,
  };
  setPointerCapture(event);
  return true;
}

function beginTokenRotation({ event, tokRot, dragRef, callbacks }) {
  const { onBeginTokenStroke } = callbacks;
  const token = tokRot.sel;

  onBeginTokenStroke?.();
  dragRef.current = {
    kind: "rotate-token",
    id: token.id,
    cx: tokRot.cx,
    cy: tokRot.cy,
    startAngle: tokRot.startAngle,
    startRot: token.rotation || 0,
  };
  setPointerCapture(event);
  return true;
}

function beginTokenPlacement({ row, col, config, callbacks, actions }) {
  const { placeTokenAt } = actions;
  const { onBeginTokenStroke } = callbacks;
  const { assetGroup, interactionMode } = config;

  if (assetGroup !== "token" || interactionMode === "select") return false;
  onBeginTokenStroke?.();
  placeTokenAt(row, col);
  return true;
}

function clearSelection({ selection, actions }) {
  const { setSelectedObjId, setSelectedObjIds, setSelectedTokenId, setSelectedTokenIds } = selection;
  const { onSelectionChange, onTokenSelectionChange } = actions;

  setSelectedObjId(null);
  setSelectedObjIds([]);
  onSelectionChange?.([]);
  setSelectedTokenId(null);
  setSelectedTokenIds([]);
  onTokenSelectionChange?.([]);
}

function handleTokenSelection({
  token,
  row,
  col,
  selection,
  actions,
  dragRef,
}) {
  const { setSelectedObjId, setSelectedObjIds, setSelectedTokenIds, setSelectedTokenId } = selection;
  const { onTokenSelectionChange } = actions;

  setSelectedObjId(null);
  setSelectedObjIds([]);
  setSelectedTokenIds([token.id]);
  setSelectedTokenId(token.id);
  onTokenSelectionChange?.([token]);

  dragRef.current = {
    kind: "token",
    id: token.id,
    offsetRow: row - token.row,
    offsetCol: col - token.col,
  };
  return true;
}

function handleObjectSelection({
  object,
  row,
  col,
  selection,
  actions,
  dragRef,
  callbacks,
  config,
}) {
  const { setSelectedTokenId, setSelectedTokenIds, setSelectedObjIds, setSelectedObjId } = selection;
  const { onSelectionChange } = actions;
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;

  onBeginObjectStroke?.(currentLayer);
  setSelectedTokenId(null);
  setSelectedTokenIds([]);
  setSelectedObjIds([object.id]);
  setSelectedObjId(object.id);
  onSelectionChange?.([object]);

  dragRef.current = {
    kind: "object",
    id: object.id,
    offsetRow: row - object.row,
    offsetCol: col - object.col,
  };
  return true;
}

function beginGridBrush({
  row,
  col,
  config,
  state,
  refs,
  actions,
  callbacks,
  getTopMostObjectAt,
}) {
  const { selectedAsset, assetGroup, isErasing, canvasColor, engine, currentLayer } = config;
  const { setIsBrushing } = state;
  const { lastTileRef } = refs;
  const {
    placeGridImageAt,
    placeGridColorStampAt,
    eraseGridStampAt,
    placeTokenAt,
  } = actions;
  const { onBeginTileStroke, onBeginObjectStroke, onBeginTokenStroke } = callbacks;
  setIsBrushing(true);
  if (lastTileRef) lastTileRef.current = { row: -1, col: -1 };

  const hitObj = getTopMostObjectAt(currentLayer, row, col);

  if ((selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") && assetGroup === "token") {
    onBeginTokenStroke?.();
    placeTokenAt(row, col);
    return true;
  }

  if (isErasing) {
    if (hitObj) onBeginObjectStroke?.(currentLayer);
    else onBeginTileStroke?.(currentLayer);
    eraseGridStampAt(Math.floor(row), Math.floor(col));
    return true;
  }

  if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
    onBeginObjectStroke?.(currentLayer);
    placeGridImageAt(row, col);
    return true;
  }

  if (selectedAsset?.kind === "color" && canvasColor) {
    onBeginTileStroke?.(currentLayer);
    placeGridColorStampAt(row, col);
    return true;
  }

  return true;
}

function beginCanvasStroke({ pointer, refs, state, callbacks, config, data }) {
  const { onBeginCanvasStroke } = callbacks;
  const { currentLayer } = config;
  const { setIsBrushing } = state;
  const { emaCssRef, lastStampCssRef } = refs;
  const { paintTipAt } = data;

  onBeginCanvasStroke?.(currentLayer);
  setIsBrushing(true);

  const start = { x: pointer.xCss, y: pointer.yCss };
  if (emaCssRef) emaCssRef.current = start;
  if (lastStampCssRef) lastStampCssRef.current = start;
  paintTipAt(start);
  return true;
}

export function createPointerDownHandler(context) {
  const {
    geometry,
    refs,
    selection,
    state,
    config,
    actions,
    callbacks,
    data,
  } = context;

  return function handlePointerDown(event) {
    const { mouseDownRef, dragRef } = refs;
    mouseDownRef.current = true;

    if (config.zoomToolActive) {
      const pointer = getPointerCssPosition(event);
      if (beginZoomDrag({ event, pointer, refs, state })) return;
    }

    const isMMB = event.button === 1 || (event.buttons & 4) === 4;
    if (config.panToolActive || state.panHotkey || isMMB) {
      if (beginPan({ event, state })) return;
    }

    const pointer = getPointerCssPosition(event);
    state.setMousePos({ x: pointer.xCss, y: pointer.yCss });

    const { hitResizeHandle, hitRotateRing, hitTokenResizeHandle, hitTokenRotateRing } = selection;

    const cornerHit = hitResizeHandle(pointer.xCss, pointer.yCss);
    if (cornerHit && beginObjectResize({ event, cornerHit, dragRef, callbacks, config })) return;

    const tokenCorner = hitTokenResizeHandle(pointer.xCss, pointer.yCss);
    if (tokenCorner && beginTokenResize({ event, tokenCorner, dragRef, callbacks })) return;

    const rotHit = hitRotateRing(pointer.xCss, pointer.yCss);
    if (rotHit && beginObjectRotation({ event, rotHit, dragRef, callbacks, config })) return;

    const tokRot = hitTokenRotateRing(pointer.xCss, pointer.yCss);
    if (tokRot && beginTokenRotation({ event, tokRot, dragRef, callbacks })) return;

    const { row, col } = computeGridPosition({
      xCss: pointer.xCss,
      yCss: pointer.yCss,
      geometry,
      gridSettings: config.gridSettings,
    });

    if (
      (config.selectedAsset?.kind === "token" || config.selectedAsset?.kind === "tokenGroup") &&
      beginTokenPlacement({ row, col, config, callbacks, actions })
    ) {
      return;
    }

    if (!config.layerIsVisible) return;

    if (config.interactionMode === "select") {
      const hit = selection.hitResizeHandle(pointer.xCss, pointer.yCss);
      if (hit && beginObjectResize({ event, cornerHit: hit, dragRef, callbacks, config })) return;

      const hitTok = selection.getTopMostTokenAt(Math.floor(row), Math.floor(col));
      if (hitTok && handleTokenSelection({ token: hitTok, row, col, selection, actions, dragRef })) return;

      const hitObj = selection.getTopMostObjectAt(config.currentLayer, Math.floor(row), Math.floor(col));
      if (hitObj && handleObjectSelection({
        object: hitObj,
        row,
        col,
        selection,
        actions,
        dragRef,
        callbacks,
        config,
      })) {
        return;
      }

      clearSelection({ selection, actions });
      dragRef.current = null;
      return;
    }

    if (config.engine === "grid" || (config.selectedAsset?.kind === "token" && config.assetGroup === "token")) {
      if (beginGridBrush({
        row,
        col,
        config,
        state,
        refs,
        actions,
        callbacks,
        getTopMostObjectAt: selection.getTopMostObjectAt,
      })) {
        return;
      }
    }

    if (config.engine === "canvas") {
      beginCanvasStroke({ pointer, refs, state, callbacks, config, data });
    }
  };
}

export default createPointerDownHandler;
