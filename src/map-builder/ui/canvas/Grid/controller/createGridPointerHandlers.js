import { clamp } from "../utils.js";

const quantize = (value, step) => {
  if (!step || step <= 0) return value;
  if (step === 1) return Math.floor(value);
  return Math.round(value / step) * step;
};

export function createGridPointerHandlers({
  geometry,
  refs,
  selection,
  state,
  config,
  actions,
  callbacks,
  data,
}) {
  const { rows, cols, cssWidth, cssHeight } = geometry;
  const {
    mouseDownRef,
    zoomDragRef,
    dragRef,
    lastStampCssRef,
    emaCssRef,
    lastTileRef,
    scrollRef,
  } = refs;
  const {
    hitResizeHandle,
    hitRotateRing,
    hitTokenResizeHandle,
    hitTokenRotateRing,
    setSelectedObjId,
    setSelectedObjIds,
    setSelectedTokenId,
    setSelectedTokenIds,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    getObjectById,
    getTokenById,
    getTopMostObjectAt,
    getTopMostTokenAt,
  } = selection;
  const { setMousePos, setIsPanning, setLastPan, setIsBrushing, isPanning, lastPan, panHotkey } = state;
  const {
    zoomToolActive,
    panToolActive,
    layerIsVisible,
    interactionMode,
    engine,
    assetGroup,
    selectedAsset,
    isErasing,
    canvasColor,
    canvasSmoothing,
    gridSettings,
    setGridSettings,
    currentLayer,
  } = config;
  const {
    placeGridImageAt,
    placeGridColorStampAt,
    eraseGridStampAt,
    placeTokenAt,
    moveObject,
    moveToken,
    updateObjectById,
    updateTokenById,
    onSelectionChange,
    onTokenSelectionChange,
  } = actions;
  const {
    onBeginTileStroke,
    onBeginCanvasStroke,
    onBeginObjectStroke,
    onBeginTokenStroke,
    onZoomToolRect,
  } = callbacks;
  const { tokens, objects, paintTipAt, stampBetweenCanvas } = data;

  const handlePointerDown = (event) => {
    mouseDownRef.current = true;

    if (zoomToolActive) {
      const rect = event.currentTarget.getBoundingClientRect();
      const xCss = event.clientX - rect.left;
      const yCss = event.clientY - rect.top;
      setMousePos({ x: xCss, y: yCss });
      const isLeft = event.button === 0 || (event.buttons & 1) === 1;
      if (!isLeft) return;
      zoomDragRef.current = {
        kind: "marquee",
        startCss: { x: xCss, y: yCss },
        curCss: { x: xCss, y: yCss },
        lastCss: { x: xCss, y: yCss },
      };
      event.preventDefault();
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    const isMMB = event.button === 1 || (event.buttons & 4) === 4;
    if (panToolActive || panHotkey || isMMB) {
      setIsPanning(true);
      setLastPan({ x: event.clientX, y: event.clientY });
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const xCss = event.clientX - rect.left;
    const yCss = event.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    const cornerHit = hitResizeHandle(xCss, yCss);
    if (cornerHit) {
      onBeginObjectStroke?.(currentLayer);
      const o = cornerHit.sel;
      const anchor = (() => {
        if (cornerHit.corner === "nw") return { row: o.row + o.hTiles, col: o.col + o.wTiles };
        if (cornerHit.corner === "ne") return { row: o.row + o.hTiles, col: o.col };
        if (cornerHit.corner === "sw") return { row: o.row, col: o.col + o.wTiles };
        return { row: o.row, col: o.col };
      })();
      dragRef.current = {
        kind: "resize-obj",
        id: o.id,
        anchorRow: anchor.row,
        anchorCol: anchor.col,
        corner: cornerHit.corner,
      };
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    const tokenCorner = hitTokenResizeHandle(xCss, yCss);
    if (tokenCorner) {
      onBeginTokenStroke?.();
      const token = tokenCorner.sel;
      const anchorToken = (() => {
        if (tokenCorner.corner === "nw")
          return { row: token.row + (token.hTiles || 1), col: token.col + (token.wTiles || 1) };
        if (tokenCorner.corner === "ne")
          return { row: token.row + (token.hTiles || 1), col: token.col };
        if (tokenCorner.corner === "sw")
          return { row: token.row, col: token.col + (token.wTiles || 1) };
        return { row: token.row, col: token.col };
      })();
      dragRef.current = {
        kind: "resize-token",
        id: token.id,
        anchorRow: anchorToken.row,
        anchorCol: anchorToken.col,
        corner: tokenCorner.corner,
      };
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    const rotHit = hitRotateRing(xCss, yCss);
    if (rotHit) {
      onBeginObjectStroke?.(currentLayer);
      const o = rotHit.sel;
      dragRef.current = {
        kind: "rotate-obj",
        id: o.id,
        cx: rotHit.cx,
        cy: rotHit.cy,
        startAngle: rotHit.startAngle,
        startRot: o.rotation || 0,
      };
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    const tokRot = hitTokenRotateRing(xCss, yCss);
    if (tokRot) {
      onBeginTokenStroke?.();
      const token = tokRot.sel;
      dragRef.current = {
        kind: "rotate-token",
        id: token.id,
        cx: tokRot.cx,
        cy: tokRot.cy,
        startAngle: tokRot.startAngle,
        startRot: token.rotation || 0,
      };
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }

    let rowRaw = (yCss / cssHeight) * rows;
    let colRaw = (xCss / cssWidth) * cols;
    if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
      rowRaw = quantize(rowRaw, gridSettings.snapStep);
      colRaw = quantize(colRaw, gridSettings.snapStep);
    }
    const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
    const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

    if (
      (selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") &&
      assetGroup === "token" &&
      interactionMode !== "select"
    ) {
      onBeginTokenStroke?.();
      placeTokenAt(row, col);
      return;
    }

    if (!layerIsVisible) return;

    if (interactionMode === "select") {
      const hit = hitResizeHandle(xCss, yCss);
      if (hit) {
        onBeginObjectStroke?.(currentLayer);
        const o = hit.sel;
        const anchor = (() => {
          if (hit.corner === "nw") return { row: o.row + o.hTiles, col: o.col + o.wTiles };
          if (hit.corner === "ne") return { row: o.row + o.hTiles, col: o.col };
          if (hit.corner === "sw") return { row: o.row, col: o.col + o.wTiles };
          return { row: o.row, col: o.col };
        })();
        dragRef.current = {
          kind: "resize-obj",
          id: o.id,
          anchorRow: anchor.row,
          anchorCol: anchor.col,
          corner: hit.corner,
        };
        event.target.setPointerCapture?.(event.pointerId);
        return;
      }

      const hitTok = getTopMostTokenAt(Math.floor(row), Math.floor(col));
      const hitObj = getTopMostObjectAt(currentLayer, Math.floor(row), Math.floor(col));

      if (hitTok) {
        setSelectedObjId(null);
        setSelectedObjIds([]);
        setSelectedTokenIds([hitTok.id]);
        setSelectedTokenId(hitTok.id);
        onTokenSelectionChange?.([hitTok]);
        dragRef.current = {
          kind: "token",
          id: hitTok.id,
          offsetRow: row - hitTok.row,
          offsetCol: col - hitTok.col,
        };
        return;
      }

      if (hitObj) {
        onBeginObjectStroke?.(currentLayer);
        setSelectedTokenId(null);
        setSelectedTokenIds([]);
        setSelectedObjIds([hitObj.id]);
        setSelectedObjId(hitObj.id);
        onSelectionChange?.([hitObj]);
        dragRef.current = {
          kind: "object",
          id: hitObj.id,
          offsetRow: row - hitObj.row,
          offsetCol: col - hitObj.col,
        };
        return;
      }

      setSelectedObjId(null);
      setSelectedObjIds([]);
      onSelectionChange?.([]);
      setSelectedTokenId(null);
      setSelectedTokenIds([]);
      onTokenSelectionChange?.([]);
      dragRef.current = null;
      return;
    }

    if (engine === "grid" || (selectedAsset?.kind === "token" && assetGroup === "token")) {
      setIsBrushing(true);
      lastTileRef.current = { row: -1, col: -1 };

      const hitObj = getTopMostObjectAt(currentLayer, row, col);
      if ((selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") && assetGroup === "token") {
        onBeginTokenStroke?.();
        placeTokenAt(row, col);
      } else if (isErasing) {
        if (hitObj) onBeginObjectStroke?.(currentLayer);
        else onBeginTileStroke?.(currentLayer);

        eraseGridStampAt(Math.floor(row), Math.floor(col));
      } else if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
        onBeginObjectStroke?.(currentLayer);
        placeGridImageAt(row, col);
      } else if (selectedAsset?.kind === "color" && canvasColor) {
        onBeginTileStroke?.(currentLayer);
        placeGridColorStampAt(row, col);
      }
      return;
    }

    if (engine === "canvas") {
      onBeginCanvasStroke?.(currentLayer);
      setIsBrushing(true);

      const start = { x: xCss, y: yCss };
      emaCssRef.current = start;
      lastStampCssRef.current = start;
      paintTipAt(start);
    }
  };

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xCss = event.clientX - rect.left;
    const yCss = event.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    if (zoomToolActive) {
      if (!mouseDownRef.current) return;
      const z = zoomDragRef.current;
      if (!z) return;
      z.curCss = { x: xCss, y: yCss };
      return;
    }

    if (isPanning && lastPan && scrollRef?.current) {
      const dx = event.clientX - lastPan.x;
      const dy = event.clientY - lastPan.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLastPan({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!mouseDownRef.current) return;
    if (!layerIsVisible) return;

    if (dragRef.current && dragRef.current.kind === "resize-obj") {
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const pr = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const pc = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

      let topRow = Math.min(dragRef.current.anchorRow, pr);
      let leftCol = Math.min(dragRef.current.anchorCol, pc);
      let bottomRow = Math.max(dragRef.current.anchorRow, pr);
      let rightCol = Math.max(dragRef.current.anchorCol, pc);
      let newH = Math.max(1, Math.round(bottomRow - topRow));
      let newW = Math.max(1, Math.round(rightCol - leftCol));

      topRow = clamp(topRow, 0, Math.max(0, rows - newH));
      leftCol = clamp(leftCol, 0, Math.max(0, cols - newW));

      const o = getObjectById(currentLayer, dragRef.current.id);
      if (o) {
        updateObjectById(currentLayer, o.id, {
          row: topRow,
          col: leftCol,
          wTiles: newW,
          hTiles: newH,
        });
        setGridSettings?.((settings) => ({ ...settings, sizeCols: newW, sizeRows: newH }));
      }
      return;
    }

    if (dragRef.current && dragRef.current.kind === "resize-token") {
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const pr = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const pc = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

      let topRow = Math.min(dragRef.current.anchorRow, pr);
      let leftCol = Math.min(dragRef.current.anchorCol, pc);
      let bottomRow = Math.max(dragRef.current.anchorRow, pr);
      let rightCol = Math.max(dragRef.current.anchorCol, pc);
      let newH = Math.max(1, Math.round(bottomRow - topRow));
      let newW = Math.max(1, Math.round(rightCol - leftCol));

      topRow = clamp(topRow, 0, Math.max(0, rows - newH));
      leftCol = clamp(leftCol, 0, Math.max(0, cols - newW));

      const token = getTokenById(dragRef.current.id);
      if (token) {
        updateTokenById?.(dragRef.current.id, {
          row: topRow,
          col: leftCol,
          wTiles: newW,
          hTiles: newH,
        });
      }
      return;
    }

    if (dragRef.current && dragRef.current.kind === "rotate-obj") {
      const angle = Math.atan2(yCss - dragRef.current.cy, xCss - dragRef.current.cx);
      const deltaRad = angle - dragRef.current.startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const o = getObjectById(currentLayer, dragRef.current.id);
      if (o) {
        let next = (dragRef.current.startRot + deltaDeg) % 360;
        if (next < 0) next += 360;
        const rot = Math.round(next);
        updateObjectById(currentLayer, o.id, { rotation: rot });
        setGridSettings?.((settings) => ({ ...settings, rotation: rot }));
      }
      return;
    }

    if (dragRef.current && dragRef.current.kind === "rotate-token") {
      const angle = Math.atan2(yCss - dragRef.current.cy, xCss - dragRef.current.cx);
      const deltaRad = angle - dragRef.current.startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const token = getTokenById(dragRef.current.id);
      if (token) {
        let next = (dragRef.current.startRot + deltaDeg) % 360;
        if (next < 0) next += 360;
        updateTokenById?.(dragRef.current.id, { rotation: Math.round(next) });
      }
      return;
    }

    if (interactionMode === "select") {
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;
      if (dragRef.current && dragRef.current.kind === "object" && selectedObjId && selectedObjIds.length <= 1) {
        const obj = getObjectById(currentLayer, selectedObjId);
        if (obj) {
          const { offsetRow, offsetCol } = dragRef.current;
          const newRow = clamp(row - offsetRow, 0, Math.max(0, rows - obj.hTiles));
          const newCol = clamp(col - offsetCol, 0, Math.max(0, cols - obj.wTiles));
          moveObject(currentLayer, obj.id, newRow, newCol);
        }
      } else if (dragRef.current && dragRef.current.kind === "token" && selectedTokenId && selectedTokenIds.length <= 1) {
        const tok = getTokenById(selectedTokenId);
        if (tok) {
          const { offsetRow, offsetCol } = dragRef.current;
          const width = tok.wTiles || 1;
          const height = tok.hTiles || 1;
          const newRow = clamp(row - offsetRow, 0, Math.max(0, rows - height));
          const newCol = clamp(col - offsetCol, 0, Math.max(0, cols - width));
          moveToken?.(tok.id, newRow, newCol);
        }
      } else if (dragRef.current && (dragRef.current.kind === "marquee-obj" || dragRef.current.kind === "marquee-token")) {
        dragRef.current.curRow = row;
        dragRef.current.curCol = col;
      }
      return;
    }

    if (engine === "grid") {
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

      const step = gridSettings?.snapStep ?? 1;
      const dedupeLikeSnap = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
      if (dedupeLikeSnap) {
        const keyRow = Math.floor(rowRaw);
        const keyCol = Math.floor(colRaw);
        if (keyRow === lastTileRef.current.row && keyCol === lastTileRef.current.col) return;
        lastTileRef.current = { row: keyRow, col: keyCol };
      }

      if (selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") return;

      if (isErasing) {
        eraseGridStampAt(row, col);
      } else if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
        placeGridImageAt(row, col);
      } else {
        placeGridColorStampAt(row, col);
      }
      return;
    }

    if (engine === "canvas") {
      const native = event.nativeEvent;
      const events = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [native];

      const alpha = clamp(canvasSmoothing ?? 0.55, 0.01, 0.99);

      let last = lastStampCssRef.current;
      let ema = emaCssRef.current || last;

      for (const ev of events) {
        const px = ev.clientX - rect.left;
        const py = ev.clientY - rect.top;

        if (!last || !ema) {
          const init = { x: px, y: py };
          lastStampCssRef.current = init;
          emaCssRef.current = init;
          paintTipAt(init);
          continue;
        }

        ema = {
          x: ema.x + (px - ema.x) * alpha,
          y: ema.y + (py - ema.y) * alpha,
        };
        stampBetweenCanvas(last, ema);
        last = ema;
      }

      lastStampCssRef.current = last;
      emaCssRef.current = ema;
    }
  };

  const handlePointerUp = (event) => {
    event.target.releasePointerCapture?.(event.pointerId);
    if (zoomToolActive) {
      const z = zoomDragRef.current;
      if (z && z.kind === "marquee") {
        const left = Math.min(z.startCss.x, z.curCss.x);
        const top = Math.min(z.startCss.y, z.curCss.y);
        const width = Math.abs(z.curCss.x - z.startCss.x);
        const height = Math.abs(z.curCss.y - z.startCss.y);
        if (width > 8 && height > 8) onZoomToolRect?.({ left, top, width, height });
      }
      zoomDragRef.current = null;
      return;
    }
    if (engine === "canvas") {
      const end = emaCssRef.current || lastStampCssRef.current;
      if (end) paintTipAt(end);
    }
    if (dragRef.current) {
      if (dragRef.current.kind === "marquee-obj" || dragRef.current.kind === "marquee-token") {
        const { startRow, startCol, curRow, curCol } = dragRef.current;
        const r1 = Math.floor(Math.min(startRow, curRow));
        const r2 = Math.ceil(Math.max(startRow, curRow));
        const c1 = Math.floor(Math.min(startCol, curCol));
        const c2 = Math.ceil(Math.max(startCol, curCol));
        if (dragRef.current.kind === "marquee-obj") {
          const arr = (objects[currentLayer] || [])
            .filter((o) => !(o.row + o.hTiles <= r1 || r2 <= o.row || o.col + o.wTiles <= c1 || c2 <= o.col))
            .map((o) => o.id);
          setSelectedObjIds(arr);
          setSelectedObjId(arr[0] || null);
          onSelectionChange?.(
            arr.map((id) => getObjectById(currentLayer, id)).filter(Boolean)
          );
        } else {
          const arr = (tokens || [])
            .filter((t) => {
              const h = t.hTiles || 1;
              const w = t.wTiles || 1;
              return !(t.row + h <= r1 || r2 <= t.row || t.col + w <= c1 || c2 <= t.col);
            })
            .map((t) => t.id);
          setSelectedTokenIds(arr);
          setSelectedTokenId(arr[0] || null);
          onTokenSelectionChange?.(
            arr.map((id) => getTokenById(id)).filter(Boolean)
          );
        }
      }
      dragRef.current = null;
    }
  };

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

export default createGridPointerHandlers;
