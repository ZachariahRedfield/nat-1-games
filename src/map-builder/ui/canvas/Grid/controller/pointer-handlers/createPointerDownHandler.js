import { computeGridPosition, getPointerCssPosition } from "./gridPointerUtils.js";
import { beginCanvasStroke } from "./pointer-down/canvasStroke.js";
import { beginGridBrush } from "./pointer-down/gridBrushHandler.js";
import { beginTokenPlacement } from "./pointer-down/tokenPlacement.js";
import { selectionHandlers } from "./pointer-down/selectionHandlers.js";
import {
  beginObjectResize,
  beginTokenResize,
  beginObjectRotation,
  beginTokenRotation,
} from "./pointer-down/resizeHandlers.js";
import { beginPan, beginZoomDrag } from "./pointer-down/zoomAndPanHandlers.js";
import { setPointerCapture } from "./pointer-down/pointerCapture.js";

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

  const { clearSelection, handleTokenSelection, handleObjectSelection } = selectionHandlers;

  return function handlePointerDown(event) {
    const { mouseDownRef, dragRef } = refs;
    mouseDownRef.current = true;

    if (config.zoomToolActive) {
      const pointer = getPointerCssPosition(event);
      if (beginZoomDrag({ event, pointer, refs, state })) return;
    }

    if (config.panToolActive || state.panHotkey) {
      if (beginPan({ event, state })) return;
    }

    const pointer = getPointerCssPosition(event);
    state.setMousePos({ x: pointer.xCss, y: pointer.yCss });
    const isInsideGrid =
      pointer.xCss >= 0 &&
      pointer.yCss >= 0 &&
      pointer.xCss <= geometry.cssWidth &&
      pointer.yCss <= geometry.cssHeight;

    const { hitResizeHandle, hitRotateRing, hitTokenResizeHandle, hitTokenRotateRing } = selection;

    if (config.interactionMode === "select") {
      const cornerHit = hitResizeHandle(pointer.xCss, pointer.yCss);
      if (cornerHit && beginObjectResize({ event, cornerHit, dragRef, callbacks, config })) return;

      const tokenCorner = hitTokenResizeHandle(pointer.xCss, pointer.yCss);
      if (tokenCorner && beginTokenResize({ event, tokenCorner, dragRef, callbacks })) return;

      const rotHit = hitRotateRing(pointer.xCss, pointer.yCss);
      if (rotHit && beginObjectRotation({ event, rotHit, dragRef, callbacks, config })) return;

      const tokRot = hitTokenRotateRing(pointer.xCss, pointer.yCss);
      if (tokRot && beginTokenRotation({ event, tokRot, dragRef, callbacks })) return;
    }

    if (!isInsideGrid) {
      mouseDownRef.current = false;
      return;
    }

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
      if (
        hitObj &&
        handleObjectSelection({
          event,
          object: hitObj,
          row,
          col,
          selection,
          actions,
          dragRef,
          callbacks,
          config,
        })
      ) {
        return;
      }

      const marqueeKind = config.assetGroup === "token" ? "marquee-token" : "marquee-obj";
      dragRef.current = {
        kind: marqueeKind,
        startRow: row,
        startCol: col,
        curRow: row,
        curCol: col,
      };
      setPointerCapture(event);
      return;
    }

    if (config.engine === "grid" || (config.selectedAsset?.kind === "token" && config.assetGroup === "token")) {
      if (
        beginGridBrush({
          row,
          col,
          config,
          state,
          refs,
          actions,
          callbacks,
          getTopMostObjectAt: selection.getTopMostObjectAt,
        })
      ) {
        return;
      }
    }

    if (config.engine === "canvas") {
      beginCanvasStroke({ pointer, refs, state, callbacks, config, data });
    }
  };
}

export default createPointerDownHandler;
