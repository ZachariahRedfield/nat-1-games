import React, { useEffect, useRef, useState } from "react";

const BASE_TILE = 32; // canvas buffer px per tile (zoom-safe)
const LAYERS = ["background", "base", "sky"];

export default function Grid({
  // data
  maps, // { background: Grid, base: Grid, sky: Grid } (strings or hex colors)
  objects, // { background: Obj[], base: Obj[], sky: Obj[] }
  assets, // Asset[] (image/color)

  // drawing config
  engine, // 'grid' | 'canvas'
  selectedAsset, // Asset or null
  gridSettings, // { sizeTiles, rotation, flipX, flipY, opacity }
  brushSize = 2, // canvas brush size in tiles
  canvasOpacity = 0.35,
  canvasColor = "#cccccc",
  canvasSpacing = 0.27, // fraction of radius
  isErasing = false,
  interactionMode = "draw", // 'draw' | 'select',

  // view / layers
  tileSize = 32,
  scrollRef,
  canvasRefs, // { background: ref, base: ref, sky: ref }
  currentLayer = "base",
  layerVisibility = { background: true, base: true, sky: true },

  // stroke lifecycle
  onBeginTileStroke, // (layer) => void
  onBeginCanvasStroke, // (layer) => void
  onBeginObjectStroke, // (layer) => void

  // mutators
  placeTiles, // (updates, colorHex?) => void
  addObject, // (layer, obj) => void
  eraseObjectAt, // (layer, row, col) => void
  moveObject,
  removeObjectById,
  updateObjectById,
  onSelectionChange,
}) {
  const rows = maps.base.length;
  const cols = maps.base[0].length;

  const cssWidth = cols * tileSize;
  const cssHeight = rows * tileSize;
  const bufferWidth = cols * BASE_TILE;
  const bufferHeight = rows * BASE_TILE;

  const layerIsVisible = layerVisibility?.[currentLayer] !== false;

  // input state
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  const mouseDownRef = useRef(false);

  // Canvas brush – stamp engine state (CSS space)
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);

  // Grid-stamp de-dupe within a stroke
  const lastTileRef = useRef({ row: -1, col: -1 });

  // ===== helpers
  const hexToRgba = (hex, a) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  const toCanvasCoords = (xCss, yCss) => {
    const scaleX = bufferWidth / cssWidth;
    const scaleY = bufferHeight / cssHeight;
    return { x: xCss * scaleX, y: yCss * scaleY };
  };

  const getActiveCtx = () => {
    const canvas = canvasRefs?.[currentLayer]?.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });

  // Selection & dragging
  const [selectedObjId, setSelectedObjId] = useState(null);
  const dragRef = useRef(null); // { id, offsetRow, offsetCol }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const eraseGridStampAt = (
    centerRow,
    centerCol,
    {
      rows,
      cols,
      gridSettings,
      objects,
      currentLayer,
      placeTiles,
      removeObjectById,
    }
  ) => {
    const size = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const wTiles = size,
      hTiles = size;

    const r0 = clamp(
      centerRow - Math.floor(hTiles / 2),
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      centerCol - Math.floor(wTiles / 2),
      0,
      Math.max(0, cols - wTiles)
    );

    // 1) Clear color tiles in the footprint
    const updates = [];
    for (let r = 0; r < hTiles; r++) {
      for (let c = 0; c < wTiles; c++) {
        updates.push({ row: r0 + r, col: c0 + c });
      }
    }
    placeTiles(updates); // parent respects isErasing and writes nulls

    // 2) Remove any objects whose rect intersects the footprint
    const arr = objects[currentLayer] || [];
    for (const o of arr) {
      const intersects = !(
        o.row + o.hTiles <= r0 ||
        r0 + hTiles <= o.row ||
        o.col + o.wTiles <= c0 ||
        c0 + wTiles <= o.col
      );
      if (intersects) removeObjectById(currentLayer, o.id);
    }
  };

  const getTopMostObjectAt = (layer, r, c) => {
    const arr = objects[layer] || [];
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      const inside =
        r >= o.row &&
        r < o.row + o.hTiles &&
        c >= o.col &&
        c < o.col + o.wTiles;
      if (inside) return o;
    }
    return null;
  };

  const getObjectById = (layer, id) =>
    (objects[layer] || []).find((o) => o.id === id);

  // ===== CANVAS BRUSH (free brush; image tip or color disc)
  const paintTipAt = (cssPt) => {
    const ctx = getActiveCtx();
    if (!ctx || !cssPt) return;
    const p = toCanvasCoords(cssPt.x, cssPt.y);

    ctx.save();
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : "source-over";
    ctx.globalAlpha = Math.max(
      0.01,
      selectedAsset?.kind === "image"
        ? gridSettings?.opacity ?? 1
        : canvasOpacity
    );

    if (selectedAsset?.kind === "image" && selectedAsset.img) {
      // image tip
      const img = selectedAsset.img;
      const pxSize = brushSize * BASE_TILE; // canvas pixels
      ctx.translate(p.x, p.y);
      // optional rotation/flips from gridSettings (reused)
      const rot = ((gridSettings?.rotation || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale(gridSettings?.flipX ? -1 : 1, gridSettings?.flipY ? -1 : 1);
      ctx.drawImage(img, -pxSize / 2, -pxSize / 2, pxSize, pxSize);
    } else {
      // solid disc
      ctx.fillStyle = hexToRgba(canvasColor, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (brushSize * BASE_TILE) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const stampBetweenCanvas = (a, b) => {
    const radiusCss = (brushSize * tileSize) / 2;
    const spacing = Math.max(1, radiusCss * canvasSpacing); // tighter = more solid
    const d = dist(a, b);
    if (d <= spacing) {
      paintTipAt(b);
      return;
    }
    const steps = Math.ceil(d / spacing);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      paintTipAt(lerp(a, b, t));
    }
  };

  // ===== GRID STAMP (image objects) or GRID COLOR (tiles)
  const placeGridImageAt = (centerRow, centerCol) => {
    if (!selectedAsset || selectedAsset.kind !== "image") return;

    const wTiles = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const aspect = selectedAsset.aspectRatio || 1;
    const hTiles = Math.max(1, Math.round(wTiles / aspect));

    // Center on hovered tile, then clamp so the footprint stays in-bounds
    const r0 = clamp(
      centerRow - Math.floor(hTiles / 2),
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      centerCol - Math.floor(wTiles / 2),
      0,
      Math.max(0, cols - wTiles)
    );

    addObject(currentLayer, {
      assetId: selectedAsset.id,
      row: r0,
      col: c0,
      wTiles,
      hTiles,
      rotation: gridSettings.rotation || 0,
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
    });
  };

  const placeGridColorStampAt = (centerRow, centerCol) => {
    // Size in tiles (square, since a solid color has no aspect)
    const size = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const wTiles = size;
    const hTiles = size;

    // Center on hovered tile, clamp so full footprint stays in bounds
    const r0 = clamp(
      centerRow - Math.floor(hTiles / 2),
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      centerCol - Math.floor(wTiles / 2),
      0,
      Math.max(0, cols - wTiles)
    );

    // Build updates for N×N
    const updates = [];
    for (let r = 0; r < hTiles; r++) {
      for (let c = 0; c < wTiles; c++) {
        updates.push({ row: r0 + r, col: c0 + c });
      }
    }

    // Opacity comes from gridSettings.opacity; color from the selected color asset (canvasColor prop)
    const a = Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1));
    const rgba = hexToRgba(canvasColor, a);

    // Write directly into the tile map (MapBuilder.placeTiles respects the color we pass)
    placeTiles(updates, rgba);
  };

  const eraseGridAt = (row, col) => {
    const hit = getTopMostObjectAt(currentLayer, row, col);
    if (hit) {
      eraseObjectAt(currentLayer, row, col);
    } else {
      // fall back to clearing the color tile at this cell
      placeTiles([{ row, col }]); // parent uses isErasing to set null
    }
  };

  const placeGridColorAt = (row, col) => {
    placeTiles([{ row, col }]); // parent uses canvasColor + isErasing
  };

  // ===== global pointerup
  useEffect(() => {
    const up = () => {
      mouseDownRef.current = false;
      setIsBrushing(false);
      setIsPanning(false);
      setLastPan(null);
      lastStampCssRef.current = null;
      emaCssRef.current = null;
      lastTileRef.current = { row: -1, col: -1 };
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (!selectedObjId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        onBeginObjectStroke?.(currentLayer);
        removeObjectById(currentLayer, selectedObjId);
        setSelectedObjId(null);
        onSelectionChange?.(null);
      } else if (e.key === "Escape") {
        setSelectedObjId(null);
        dragRef.current = null;
        onSelectionChange?.(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedObjId, currentLayer]);

  // When controls (gridSettings) change and an object is selected, live-update it
  useEffect(() => {
    if (!selectedObjId) return;
    const obj = getObjectById(currentLayer, selectedObjId);
    if (!obj) return;

    // Compute new size from Size (tiles wide) while preserving aspect
    const a = getAssetById(obj.assetId);
    const aspect = a?.aspectRatio || 1;
    const wTiles = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const hTiles = Math.max(1, Math.round(wTiles / aspect));

    // Keep the object's center stable as you resize
    const centerRow = obj.row + obj.hTiles / 2;
    const centerCol = obj.col + obj.wTiles / 2;
    let newRow = Math.round(centerRow - hTiles / 2);
    let newCol = Math.round(centerCol - wTiles / 2);
    newRow = clamp(newRow, 0, Math.max(0, rows - hTiles));
    newCol = clamp(newCol, 0, Math.max(0, cols - wTiles));

    updateObjectById(currentLayer, obj.id, {
      wTiles,
      hTiles,
      row: newRow,
      col: newCol,
      rotation: gridSettings.rotation || 0,
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
    });
  }, [gridSettings, selectedObjId, currentLayer, rows, cols]);

  const [panHotkey, setPanHotkey] = useState(false); // spacebar held?

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        setPanHotkey(true);
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") setPanHotkey(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ===== pointer overlay
  const handlePointerDown = (e) => {
    mouseDownRef.current = true;

    // Pan gesture: spacebar or middle mouse
    const isMMB = e.button === 1 || (e.buttons & 4) === 4;
    if (panHotkey || isMMB) {
      setIsPanning(true);
      setLastPan({ x: e.clientX, y: e.clientY });
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    // Layer lock
    if (!layerIsVisible) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    const row = Math.floor((yCss / cssHeight) * rows);
    const col = Math.floor((xCss / cssWidth) * cols);

    // ===== SELECT MODE =====
    if (interactionMode === "select") {
      const hitObj = getTopMostObjectAt(currentLayer, row, col);
      if (hitObj) {
        onBeginObjectStroke?.(currentLayer);
        setSelectedObjId(hitObj.id);
        onSelectionChange?.(hitObj);
        dragRef.current = {
          id: hitObj.id,
          offsetRow: row - hitObj.row,
          offsetCol: col - hitObj.col,
        };
      } else {
        // click empty: clear selection
        setSelectedObjId(null);
        onSelectionChange?.(null);
      }
      return; // no stamping/erasing in select mode
    }

    if (engine === "grid") {
      setIsBrushing(true);
      lastTileRef.current = { row: -1, col: -1 };

      const hitObj = getTopMostObjectAt(currentLayer, row, col);

      // Selection/dragging takes priority when not erasing
      if (!isErasing && hitObj) {
        onBeginObjectStroke?.(currentLayer);
        setSelectedObjId(hitObj.id);
        onSelectionChange?.(hitObj); // ← tell parent we selected this
        dragRef.current = {
          id: hitObj.id,
          offsetRow: row - hitObj.row,
          offsetCol: col - hitObj.col,
        };
        return;
      }

      // Clicked empty space → clear selection in parent
      if (!isErasing && !hitObj) {
        setSelectedObjId(null);
        onSelectionChange?.(null); // ← restore parent’s defaults
      }

      // Stamping / Erasing
      if (isErasing) {
        if (hitObj) onBeginObjectStroke?.(currentLayer);
        else onBeginTileStroke?.(currentLayer);

        eraseGridStampAt(row, col, {
          rows,
          cols,
          gridSettings,
          objects,
          currentLayer,
          placeTiles,
          removeObjectById,
        });
      } else if (selectedAsset?.kind === "image") {
        onBeginObjectStroke?.(currentLayer);
        placeGridImageAt(row, col);
      } else {
        onBeginTileStroke?.(currentLayer);
        placeGridColorStampAt(row, col);
      }
      return;
    }

    if (engine === "canvas") {
      onBeginCanvasStroke?.(currentLayer); // snapshot BEFORE paint
      setIsBrushing(true);

      // init smoothing
      const start = { x: xCss, y: yCss };
      emaCssRef.current = start;
      lastStampCssRef.current = start;

      // start with a solid stamp
      paintTipAt(start);
      return;
    }
  };

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    if (engine === "pan" && isPanning && lastPan && scrollRef?.current) {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLastPan({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!mouseDownRef.current) return;
    if (!layerIsVisible) return;

    // SELECT MODE drag
    if (interactionMode === "select") {
      const row = Math.floor((yCss / cssHeight) * rows);
      const col = Math.floor((xCss / cssWidth) * cols);
      if (dragRef.current && selectedObjId) {
        const obj = getObjectById(currentLayer, selectedObjId);
        if (obj) {
          const { offsetRow, offsetCol } = dragRef.current;
          const newRow = clamp(
            row - offsetRow,
            0,
            Math.max(0, rows - obj.hTiles)
          );
          const newCol = clamp(
            col - offsetCol,
            0,
            Math.max(0, cols - obj.wTiles)
          );
          moveObject(currentLayer, obj.id, newRow, newCol);
        }
      }
      return; // no stamping while selecting
    }

    if (engine === "grid") {
      const row = Math.floor((yCss / cssHeight) * rows);
      const col = Math.floor((xCss / cssWidth) * cols);

      // Dragging?
      if (dragRef.current && selectedObjId) {
        const obj = getObjectById(currentLayer, selectedObjId);
        if (obj) {
          const { offsetRow, offsetCol } = dragRef.current;
          const newRow = clamp(
            row - offsetRow,
            0,
            Math.max(0, rows - obj.hTiles)
          );
          const newCol = clamp(
            col - offsetCol,
            0,
            Math.max(0, cols - obj.wTiles)
          );
          moveObject(currentLayer, obj.id, newRow, newCol);
        }
        return;
      }

      // De-dupe tile hits
      if (row === lastTileRef.current.row && col === lastTileRef.current.col)
        return;
      lastTileRef.current = { row, col };

      if (isErasing) {
        eraseGridStampAt(row, col, {
          rows,
          cols,
          gridSettings,
          objects,
          currentLayer,
          placeTiles,
          removeObjectById,
        });
      } else if (selectedAsset?.kind === "image") {
        placeGridImageAt(row, col);
      } else {
        placeGridColorStampAt(row, col);
      }
      return;
    }

    if (engine === "canvas") {
      // Use native coalesced events for silky strokes
      const native = e.nativeEvent;
      const events =
        typeof native.getCoalescedEvents === "function"
          ? native.getCoalescedEvents()
          : [native];

      // EMA smoothing factor
      const alpha = 0.55;

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

        // smooth
        ema = {
          x: ema.x + (px - ema.x) * alpha,
          y: ema.y + (py - ema.y) * alpha,
        };
        // lay stamps between last and ema
        stampBetweenCanvas(last, ema);
        last = ema;
      }

      lastStampCssRef.current = last;
      emaCssRef.current = ema;
      return;
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture?.(e.pointerId);
    if (engine === "canvas") {
      const end = emaCssRef.current || lastStampCssRef.current;
      if (end) paintTipAt(end);
    }
    if (dragRef.current) {
      dragRef.current = null;
    }
    if (!dragRef.current && selectedObjId) {
      // Click release over empty space is handled in pointerDown; nothing extra here
    }
  };

  // ===== RENDERING

  // render a tile cell background from maps (supports named or hex)
  const cellBg = (v) => {
    if (!v) return "transparent";
    if (typeof v === "string") {
      if (v.startsWith("rgba(") || v.startsWith("rgb(")) return v; // NEW: accept rgba/rgb
      if (v.startsWith("#")) return v; // hex
    }
    // fallback demo names
    return v === "grass"
      ? "green"
      : v === "water"
      ? "blue"
      : v === "stone"
      ? "gray"
      : "transparent";
  };

  // find asset by id (cheap enough for now)
  const getAssetById = (id) => assets.find((a) => a.id === id);
  // Decide cursor based on pan/select/visibility
  const cursorStyle =
    isPanning || panHotkey
      ? "grabbing"
      : !layerIsVisible
      ? "not-allowed"
      : interactionMode === "select"
      ? "default"
      : "crosshair";

  return (
    <div className="relative inline-block" style={{ padding: 16 }}>
      <div style={{ position: "relative", width: cssWidth, height: cssHeight }}>
        {/* 1) Per-layer TILE GRIDS */}
        {LAYERS.map((layer, i) => (
          <div
            key={`tiles-${layer}`}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: cssWidth,
              height: cssHeight,
              zIndex: 10 + i * 20,
              display: layerVisibility[layer] ? "block" : "none",
            }}
          >
            <div
              className="grid"
              style={{
                width: cssWidth,
                height: cssHeight,
                gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
                gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
              }}
            >
              {maps[layer].map((rowArr, ri) =>
                rowArr.map((val, ci) => (
                  <div
                    key={`${layer}-${ri}-${ci}`}
                    className="border border-gray-600"
                    style={{
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: cellBg(val),
                    }}
                  />
                ))
              )}
            </div>
          </div>
        ))}

        {/* 2) Per-layer OBJECTS (image stamps) — above tiles, below canvas */}
        {LAYERS.map((layer, i) => (
          <div
            key={`objs-${layer}`}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: cssWidth,
              height: cssHeight,
              zIndex: 11 + i * 20,
              display: layerVisibility[layer] ? "block" : "none",
            }}
          >
            {objects[layer].map((o) => {
              const a = getAssetById(o.assetId);
              if (!a || a.kind !== "image") return null;
              const left = o.col * tileSize;
              const top = o.row * tileSize;
              const w = o.wTiles * tileSize;
              const h = o.hTiles * tileSize;
              const rot = o.rotation || 0;
              const sx = o.flipX ? -1 : 1;
              const sy = o.flipY ? -1 : 1;

              return (
                <div
                  key={o.id}
                  className="absolute"
                  style={{
                    left,
                    top,
                    width: w,
                    height: h,
                    transformOrigin: "center",
                    transform: `translate(0,0) rotate(${rot}deg) scale(${sx}, ${sy})`,
                    opacity: o.opacity ?? 1,
                  }}
                >
                  <img
                    src={a.src}
                    alt={a.name}
                    className="w-full h-full object-fill pointer-events-none select-none"
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Selection overlay (on top of objects, below canvas) */}
        {LAYERS.map((layer, i) => {
          const sel =
            layer === currentLayer ? getObjectById(layer, selectedObjId) : null;
          if (!sel || !layerVisibility[layer]) return null;

          const left = sel.col * tileSize;
          const top = sel.row * tileSize;
          const w = sel.wTiles * tileSize;
          const h = sel.hTiles * tileSize;

          return (
            <div
              key={`sel-${layer}`}
              className="absolute pointer-events-none"
              style={{
                left,
                top,
                width: w,
                height: h,
                zIndex: 12 + i * 20 - 1, // just above objects layer
                border: "2px dashed #4ade80", // green dashed outline
                boxShadow: "0 0 0 2px rgba(74,222,128,0.3) inset",
              }}
            />
          );
        })}

        {/* 3) Per-layer CANVASES (VFX) — on top */}
        {LAYERS.map((layer, i) => (
          <canvas
            key={`canvas-${layer}`}
            ref={canvasRefs?.[layer]}
            width={bufferWidth}
            height={bufferHeight}
            style={{
              width: cssWidth,
              height: cssHeight,
              zIndex: 12 + i * 20,
              display: layerVisibility[layer] ? "block" : "none",
            }}
            className="absolute top-0 left-0 pointer-events-none"
          />
        ))}

        {/* 4) Canvas brush preview */}
        {engine === "canvas" && layerIsVisible && mousePos && (
          <div
            className="absolute rounded-full border border-white pointer-events-none"
            style={{
              left: mousePos.x - brushSize * tileSize * 0.5,
              top: mousePos.y - brushSize * tileSize * 0.5,
              width: brushSize * tileSize,
              height: brushSize * tileSize,
              zIndex: 99,
              backgroundColor:
                selectedAsset?.kind === "image"
                  ? "transparent"
                  : "rgba(255,255,255,0.1)",
            }}
          />
        )}

        {/* 5) Pointer overlay */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: cssWidth,
            height: cssHeight,
            zIndex: 100,
            cursor: cursorStyle, // ← use the computed value
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()} // optional (future right-click pan)
        />
      </div>
    </div>
  );
}
