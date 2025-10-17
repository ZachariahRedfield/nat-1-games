import React, { useEffect, useRef, useState } from "react";
// Grid.jsx overview
// - Organizes draw modes (grid vs canvas), selection/dragging, and rendering
// - Helpers and constants shared via ./utils
// - Potential presentational splits exist (TilesLayer, ObjectsLayer, etc.) for maintainability
import { BASE_TILE, LAYERS, clamp, hexToRgba, dist, lerp } from "./utils";
import TilesLayer from "./TilesLayer";
import ObjectsLayer from "./ObjectsLayer";
import SelectionOverlay from "./SelectionOverlay";
import TokenLayer from "./TokenLayer";
import CanvasLayers from "./CanvasLayers";
import BrushPreview from "./BrushPreview";
import PointerOverlay from "./PointerOverlay";

export default function Grid({
  // ===== Props: data (what to render)
  maps, // { background: Grid, base: Grid, sky: Grid } (strings or hex colors)
  objects, // { background: Obj[], base: Obj[], sky: Obj[] }
  assets, // Asset[] (image/color)

  // ===== Props: drawing config (how to interact)
  engine, // 'grid' | 'canvas'
  selectedAsset, // Asset or null
  gridSettings, // { sizeTiles, rotation, flipX, flipY, opacity }
  brushSize = 2, // canvas brush size in tiles
  canvasOpacity = 0.35,
  canvasColor = "#cccccc",
  canvasSpacing = 0.27, // fraction of radius
  canvasBlendMode = "source-over",
  canvasSmoothing = 0.55,
  naturalSettings = { randomRotation: false, randomFlipX: false, randomFlipY: false, randomSize: { enabled: false, min: 1, max: 1 }, randomOpacity: { enabled: false, min: 1, max: 1 }, randomVariant: true },
  isErasing = false,
  interactionMode = "draw", // 'draw' | 'select',

  // ===== Props: view / layers (where and which)
  tileSize = 32,
  scrollRef,
  canvasRefs, // { background: ref, base: ref, sky: ref }
  currentLayer = "base",
  layerVisibility = { background: true, base: true, sky: true },
  tokensVisible = true,
  tokenHUDVisible = true,
  assetGroup = 'image',

  // ===== Props: stroke lifecycle (callbacks)
  onBeginTileStroke, // (layer) => void
  onBeginCanvasStroke, // (layer) => void
  onBeginObjectStroke, // (layer) => void
  onBeginTokenStroke, // () => void

  // ===== Props: mutators (state changes in parent)
  placeTiles, // (updates, colorHex?) => void
  addObject, // (layer, obj) => void
  eraseObjectAt, // (layer, row, col) => void
  moveObject,
  removeObjectById,
  updateObjectById,
  onSelectionChange,
  // Tokens
  tokens = [],
  addToken,
  moveToken,
  removeTokenById,
  updateTokenById,
  onTokenSelectionChange,
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

  // Canvas brush â€“ stamp engine state (CSS space)
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);

  // Grid-stamp de-dupe within a stroke
  const lastTileRef = useRef({ row: -1, col: -1 });

  // ===== Helpers (instance-bound)

  const quantize = (v, step) => {
    if (!step || step <= 0) return v;
    return Math.round(v / step) * step;
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

  // dist / lerp come from utils

  // Selection & dragging
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const dragRef = useRef(null); // { kind:'object'|'token', id, offsetRow, offsetCol }

  // clamp comes from utils

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

  const getTopMostTokenAt = (r, c) => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      const inside =
        r >= t.row && r < t.row + (t.hTiles || 1) &&
        c >= t.col && c < t.col + (t.wTiles || 1);
      if (inside) return t;
    }
    return null;
  };
  const getTokenById = (id) => tokens.find((t) => t.id === id);

  // ===== CANVAS BRUSH (free brush; image tip or color disc)
  const paintTipAt = (cssPt) => {
    const ctx = getActiveCtx();
    if (!ctx || !cssPt) return;
    const p = toCanvasCoords(cssPt.x, cssPt.y);

    ctx.save();
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : canvasBlendMode || "source-over";
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
    if (!selectedAsset || (selectedAsset.kind !== "image" && selectedAsset.kind !== "natural")) return;

    const isNatural = selectedAsset.kind === 'natural';
    const variants = isNatural ? (selectedAsset.variants || []) : null;
    const chooseVariantIndex = () => {
      if (!isNatural) return undefined;
      const n = variants?.length || 0;
      if (n <= 0) return 0;
      if (naturalSettings?.randomVariant) return Math.floor(Math.random() * n);
      return 0;
    };
    const variantIndex = chooseVariantIndex();
    const variantAspect = isNatural ? (variants?.[variantIndex || 0]?.aspectRatio || 1) : (selectedAsset.aspectRatio || 1);

    const baseSize = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const sizeTiles = naturalSettings?.randomSize?.enabled
      ? Math.max(1, Math.round(Math.min(naturalSettings.randomSize.max || baseSize, Math.max(naturalSettings.randomSize.min || 1, Math.random() * ((naturalSettings.randomSize.max || baseSize) - (naturalSettings.randomSize.min || 1)) + (naturalSettings.randomSize.min || 1)))))
      : baseSize;
    const wTiles = sizeTiles;
    const aspect = variantAspect;
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

    // Determine rotation with optional smart adjacency (square stamps only)
    const decideRotation = () => gridSettings.rotation || 0;

    const autoRotation = naturalSettings?.randomRotation
      ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
      : decideRotation();

    const flipX = naturalSettings?.randomFlipX ? (Math.random() < 0.5) : !!gridSettings.flipX;
    const flipY = naturalSettings?.randomFlipY ? (Math.random() < 0.5) : !!gridSettings.flipY;
    const opacity = naturalSettings?.randomOpacity?.enabled
      ? Math.max(0.05, Math.min(1, (naturalSettings.randomOpacity.min ?? 0.05) + Math.random() * Math.max(0, (naturalSettings.randomOpacity.max ?? 1) - (naturalSettings.randomOpacity.min ?? 0.05)) ))
      : Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1));

    addObject(currentLayer, {
      assetId: selectedAsset.id,
      row: r0,
      col: c0,
      wTiles,
      hTiles,
      rotation: autoRotation,
      flipX,
      flipY,
      opacity,
      ...(isNatural ? { variantIndex: variantIndex || 0 } : {}),
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

    // Build updates for NÃ—N
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

  const placeTokenAt = (centerRow, centerCol) => {
    if (!selectedAsset || selectedAsset.kind !== "token") return;
    const wTiles = Math.max(1, Math.round(gridSettings.sizeTiles || 1));
    const aspect = selectedAsset.aspectRatio || 1;
    const hTiles = Math.max(1, Math.round(wTiles / aspect));
    const r0 = clamp(
      (gridSettings?.snapToGrid ? (centerRow - Math.floor(hTiles / 2)) : (centerRow - hTiles / 2)),
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      (gridSettings?.snapToGrid ? (centerCol - Math.floor(wTiles / 2)) : (centerCol - wTiles / 2)),
      0,
      Math.max(0, cols - wTiles)
    );
    addToken?.({
      assetId: selectedAsset.id,
      row: r0,
      col: c0,
      wTiles,
      hTiles,
      rotation: gridSettings.rotation || 0,
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
      glowColor: '#7dd3fc',
      meta: { name: selectedAsset?.name || 'Token', hp: 0, initiative: 0 },
    });
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
      if (selectedTokenId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          onBeginTokenStroke?.();
          removeTokenById?.(selectedTokenId);
          setSelectedTokenId(null);
          onTokenSelectionChange?.(null);
        } else if (e.key === "Escape") {
          setSelectedTokenId(null);
          dragRef.current = null;
          onTokenSelectionChange?.(null);
        }
        return;
      }
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
  }, [selectedObjId, selectedTokenId, currentLayer]);

  // When switching asset group, clear opposite selections so controls don't update both
  useEffect(() => {
    if (assetGroup === 'token') {
      if (selectedObjId) {
        setSelectedObjId(null);
        onSelectionChange?.(null);
      }
    } else {
      if (selectedTokenId) {
        setSelectedTokenId(null);
        onTokenSelectionChange?.(null);
      }
    }
  }, [assetGroup]);

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

  // Live-update selected token when gridSettings change (size/rotation/opacity)
  useEffect(() => {
    if (!selectedTokenId) return;
    const tok = getTokenById(selectedTokenId);
    if (!tok) return;
    const wTiles = Math.max(1, Math.round(gridSettings.sizeTiles || tok.wTiles || 1));
    const hTiles = Math.max(1, Math.round(wTiles / 1));
    const centerRow = tok.row + (tok.hTiles || 1) / 2;
    const centerCol = tok.col + (tok.wTiles || 1) / 2;
    let newRow = Math.round(centerRow - hTiles / 2);
    let newCol = Math.round(centerCol - wTiles / 2);
    newRow = clamp(newRow, 0, Math.max(0, rows - hTiles));
    newCol = clamp(newCol, 0, Math.max(0, cols - wTiles));
    updateTokenById?.(selectedTokenId, {
      wTiles,
      hTiles,
      row: newRow,
      col: newCol,
      rotation: gridSettings.rotation || 0,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
    });
  }, [gridSettings, selectedTokenId, rows, cols]);

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

    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    let rowRaw = (yCss / cssHeight) * rows;
    let colRaw = (xCss / cssWidth) * cols;
    if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
      rowRaw = quantize(rowRaw, gridSettings.snapStep);
      colRaw = quantize(colRaw, gridSettings.snapStep);
    }
    const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
    const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

    // Token placement: only in draw mode and only when Token Asset menu is active
    if (selectedAsset?.kind === 'token' && assetGroup === 'token' && interactionMode !== 'select') {
      onBeginTokenStroke?.();
      placeTokenAt(row, col);
      return;
    }

    // Layer lock (for non-token operations)
    if (!layerIsVisible) return;

    // ===== SELECT MODE =====
    if (interactionMode === "select") {
      if (assetGroup === 'token') {
        const hitTok = getTopMostTokenAt(Math.floor(row), Math.floor(col));
        if (hitTok) {
          setSelectedTokenId(hitTok.id);
          onTokenSelectionChange?.(hitTok);
          dragRef.current = { kind: 'token', id: hitTok.id, offsetRow: row - hitTok.row, offsetCol: col - hitTok.col };
        } else {
          setSelectedTokenId(null);
          onTokenSelectionChange?.(null);
        }
        return;
      } else {
        const hitObj = getTopMostObjectAt(currentLayer, Math.floor(row), Math.floor(col));
        if (hitObj) {
          onBeginObjectStroke?.(currentLayer);
          setSelectedObjId(hitObj.id);
          onSelectionChange?.(hitObj);
          dragRef.current = { kind: 'object', id: hitObj.id, offsetRow: row - hitObj.row, offsetCol: col - hitObj.col };
        } else {
          setSelectedObjId(null);
          onSelectionChange?.(null);
        }
        return; // no stamping/erasing in select mode
      }
    }

    if (engine === "grid" || (selectedAsset?.kind === 'token' && assetGroup === 'token')) {
      setIsBrushing(true);
      lastTileRef.current = { row: -1, col: -1 };

      const hitObj = getTopMostObjectAt(currentLayer, row, col);
      // In draw mode, ignore selection/drag.
      // Stamping / Erasing
      if (selectedAsset?.kind === 'token' && assetGroup === 'token') {
        onBeginTokenStroke?.();
        placeTokenAt(row, col);
      } else if (isErasing) {
        if (hitObj) onBeginObjectStroke?.(currentLayer);
        else onBeginTileStroke?.(currentLayer);

        eraseGridStampAt(Math.floor(row), Math.floor(col), {
          rows,
          cols,
          gridSettings,
          objects,
          currentLayer,
          placeTiles,
          removeObjectById,
        });
      } else if (selectedAsset?.kind === "image" || selectedAsset?.kind === 'natural') {
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
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;
      if (dragRef.current && dragRef.current.kind === 'object' && selectedObjId) {
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
      } else if (dragRef.current && dragRef.current.kind === 'token' && selectedTokenId) {
        const tok = getTokenById(selectedTokenId);
        if (tok) {
          const { offsetRow, offsetCol } = dragRef.current;
          const w = tok.wTiles || 1, h = tok.hTiles || 1;
          const newRow = clamp(row - offsetRow, 0, Math.max(0, rows - h));
          const newCol = clamp(col - offsetCol, 0, Math.max(0, cols - w));
          moveToken?.(tok.id, newRow, newCol);
        }
      }
      return; // no stamping while selecting
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

      // De-dupe only when snapping; in free-place we allow continuous stamps
      if (gridSettings?.snapToGrid) {
        if (row === lastTileRef.current.row && col === lastTileRef.current.col) return;
        lastTileRef.current = { row, col };
      }

      // For token assets, only place on pointer down (single-click), not on move
      if (selectedAsset?.kind === 'token') return;

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
      } else if (selectedAsset?.kind === "image" || selectedAsset?.kind === 'natural') {
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

      // EMA smoothing factor (exposed via settings)
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

        // smooth
        ema = {
          x: ema.x + (px - ema.x) * alpha,
          y: ema.y + (py - ema.y) * alpha,
        };
        // lay stamps between last and ema (pixels or objects)
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
    if (!dragRef.current && (selectedObjId || selectedTokenId)) {
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
        <TilesLayer
          maps={maps}
          rows={rows}
          cols={cols}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
          cellBg={cellBg}
        />

        {/* 2) Per-layer OBJECTS (image stamps) - above tiles, below tokens/canvas */}
        <ObjectsLayer
          objects={objects}
          assets={assets}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        {/* 3) Tokens overlay */}
        <TokenLayer
          tokens={tokens}
          assets={assets}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          visible={tokensVisible}
          showHUD={tokenHUDVisible}
        />

        {/* 4) Selection overlay (on top of objects, below canvas) */}
        <SelectionOverlay
          objects={objects}
          currentLayer={currentLayer}
          selectedObjId={selectedObjId}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        {/* 5) Per-layer CANVASES (VFX) - on top */}
        <CanvasLayers
          canvasRefs={canvasRefs}
          bufferWidth={bufferWidth}
          bufferHeight={bufferHeight}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        {/* 6) Canvas brush preview */}
        <BrushPreview
          engine={engine}
          layerIsVisible={layerIsVisible}
          mousePos={mousePos}
          brushSize={brushSize}
          tileSize={tileSize}
          selectedAsset={selectedAsset}
        />

        {/* 7) Pointer overlay */}
        <PointerOverlay
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          cursorStyle={cursorStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />


        

      </div>
    </div>
  );
}

