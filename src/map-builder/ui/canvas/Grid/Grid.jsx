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
import useGridSelection from "./selection/useGridSelection.js";
import TokenSelectionOverlay from "./overlays/TokenSelectionOverlay.jsx";
import ActiveSelectionMiniPanel from "./overlays/ActiveSelectionMiniPanel.jsx";
import MarqueeOverlay from "./overlays/MarqueeOverlay.jsx";
import ZoomToolOverlay from "./overlays/ZoomToolOverlay.jsx";

export default function Grid({
  // ===== Props: data (what to render)
  maps, // { background: Grid, base: Grid, sky: Grid } (strings or hex colors)
  objects, // { background: Obj[], base: Obj[], sky: Obj[] }
  assets, // Asset[] (image/color)

  // ===== Props: drawing config (how to interact)
  engine, // 'grid' | 'canvas'
  selectedAsset, // Asset or null
  gridSettings, // { sizeTiles, rotation, flipX, flipY, opacity }
  stampSettings = null, // when stamping new assets, use these settings (per-asset defaults)
  setGridSettings,
  brushSize = 2, // canvas brush size in tiles
  canvasOpacity = 0.35,
  canvasColor = null,
  canvasSpacing = 0.27, // fraction of radius
  canvasBlendMode = "source-over",
  canvasSmoothing = 0.55,
  naturalSettings = { randomRotation: false, randomFlipX: false, randomFlipY: false, randomSize: { enabled: false, min: 1, max: 1 }, randomOpacity: { enabled: false, min: 1, max: 1 }, randomVariant: true },
  isErasing = false,
  interactionMode = "draw", // 'draw' | 'select',

  // ===== Props: view / layers (where and which)
  tileSize = 32,
  scrollRef,
  contentRef,
  canvasRefs, // { background: ref, base: ref, sky: ref }
  currentLayer = "base",
  layerVisibility = { background: true, base: true, sky: true },
  tokensVisible = true,
  tokenHUDVisible = true,
  tokenHUDShowInitiative = false,
  assetGroup = 'image',
  showGridLines = true,

  // ===== Props: view zoom tool
  zoomToolActive = false,
  panToolActive = false,
  onZoomToolRect,

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

  // Canvas brush – stamp engine state (CSS space)
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);

  // Active settings used for stamping (not selection edits)
  const stamp = stampSettings || gridSettings || {};

  // Grid-stamp de-dupe within a stroke
  const lastTileRef = useRef({ row: -1, col: -1 });

  // Zoom tool gesture state
  const zoomDragRef = useRef(null); // { kind:'pending'|'marquee'|'drag', startCss:{x,y}, curCss:{x,y}, lastCss:{x,y} }

  // ===== Helpers (instance-bound)

  const quantize = (v, step) => {
    if (!step || step <= 0) return v;
    // For step = 1, mimic snap-to-grid behavior exactly (floor, not round)
    if (step === 1) return Math.floor(v);
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
  const dragRef = useRef(null); // { kind:'object'|'token', id, offsetRow, offsetCol }

  const {
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    setSelectedObjId,
    setSelectedObjIds,
    setSelectedTokenId,
    setSelectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getObjectById,
    getTokenById,
  } = useGridSelection({
    objects,
    tokens,
    assets,
    currentLayer,
    gridSettings,
    rows,
    cols,
    dragRef,
    assetGroup,
    interactionMode,
    onSelectionChange,
    onTokenSelectionChange,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    updateObjectById,
    updateTokenById,
  });

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
    const wTiles = Math.max(1, Math.round(gridSettings.sizeCols || gridSettings.sizeTiles || 1));
    const hTiles = Math.max(1, Math.round(gridSettings.sizeRows || gridSettings.sizeTiles || 1));

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

  // ===== Resize handle hit-test (single-object only)
  const hitResizeHandle = (xCss, yCss) => {
    const sel = getSelectedObject();
    if (!sel) return null;
    const left = sel.col * tileSize;
    const top = sel.row * tileSize;
    const w = sel.wTiles * tileSize;
    const h = sel.hTiles * tileSize;
    const sz = 10; // hit box size (px) around corners
    const within = (cx, cy) => Math.abs(xCss - cx) <= sz && Math.abs(yCss - cy) <= sz;
    const corners = [
      { corner: 'nw', x: left, y: top },
      { corner: 'ne', x: left + w, y: top },
      { corner: 'sw', x: left, y: top + h },
      { corner: 'se', x: left + w, y: top + h },
    ];
    for (const c of corners) {
      if (within(c.x, c.y)) return { sel, corner: c.corner };
    }
    return null;
  };

  // ===== Rotation ring hit-test (single-object only)
  const hitRotateRing = (xCss, yCss) => {
    const sel = getSelectedObject();
    if (!sel) return null;
    const cx = (sel.col + sel.wTiles / 2) * tileSize;
    const cy = (sel.row + sel.hTiles / 2) * tileSize;
    const rx = (sel.wTiles * tileSize) / 2;
    const ry = (sel.hTiles * tileSize) / 2;
    const r = Math.sqrt(rx * rx + ry * ry) + 8;
    const dx = xCss - cx;
    const dy = yCss - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const tol = 8; // ring thickness for hit
    if (dist >= r - tol && dist <= r + tol) {
      const angle = Math.atan2(dy, dx); // radians
      return { sel, cx, cy, startAngle: angle };
    }
    return null;
  };

  // ===== Token handle/ring hit-tests (single-token only)
  const hitTokenResizeHandle = (xCss, yCss) => {
    const sel = getSelectedToken();
    if (!sel) return null;
    const left = sel.col * tileSize;
    const top = sel.row * tileSize;
    const w = (sel.wTiles || 1) * tileSize;
    const h = (sel.hTiles || 1) * tileSize;
    const sz = 10; // px
    const within = (cx, cy) => Math.abs(xCss - cx) <= sz && Math.abs(yCss - cy) <= sz;
    const corners = [
      { corner: 'nw', x: left, y: top },
      { corner: 'ne', x: left + w, y: top },
      { corner: 'sw', x: left, y: top + h },
      { corner: 'se', x: left + w, y: top + h },
    ];
    for (const c of corners) {
      if (within(c.x, c.y)) return { sel, corner: c.corner };
    }
    return null;
  };

  const hitTokenRotateRing = (xCss, yCss) => {
    const sel = getSelectedToken();
    if (!sel) return null;
    const cx = (sel.col + (sel.wTiles || 1) / 2) * tileSize;
    const cy = (sel.row + (sel.hTiles || 1) / 2) * tileSize;
    const rx = ((sel.wTiles || 1) * tileSize) / 2;
    const ry = ((sel.hTiles || 1) * tileSize) / 2;
    const r = Math.sqrt(rx * rx + ry * ry) + 8;
    const dx = xCss - cx;
    const dy = yCss - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const tol = 8;
    if (dist >= r - tol && dist <= r + tol) {
      const angle = Math.atan2(dy, dx);
      return { sel, cx, cy, startAngle: angle };
    }
    return null;
  };

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
        ? (stamp?.opacity ?? gridSettings?.opacity ?? 1)
        : canvasOpacity
    );

    if (selectedAsset?.kind === "image" && selectedAsset.img) {
      // image tip
      const img = selectedAsset.img;
      const pxSize = brushSize * BASE_TILE; // canvas pixels
      ctx.translate(p.x, p.y);
      // optional rotation/flips from gridSettings (reused)
      const rot = (((stamp?.rotation ?? gridSettings?.rotation) || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale((stamp?.flipX ?? gridSettings?.flipX) ? -1 : 1, (stamp?.flipY ?? gridSettings?.flipY) ? -1 : 1);
      ctx.drawImage(img, -pxSize / 2, -pxSize / 2, pxSize, pxSize);
    } else {
      // solid disc only when a Material (color) is selected
      if (!canvasColor || selectedAsset?.kind !== 'color') {
        ctx.restore();
        return;
      }
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

    const aspect = variantAspect;
    const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const hTiles = Math.max(1, Math.round((stamp.sizeRows ?? Math.round(wTiles / aspect))));

    // Snap-like behavior when snapStep === 1 even if snapToGrid is off
    const step = (gridSettings?.snapStep ?? 1);
    const snapLike = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    const baseRow = snapLike ? Math.floor(centerRow) : centerRow;
    const baseCol = snapLike ? Math.floor(centerCol) : centerCol;
    const halfH = snapLike ? Math.floor(hTiles / 2) : (hTiles / 2);
    const halfW = snapLike ? Math.floor(wTiles / 2) : (wTiles / 2);
    // Center on hovered position, then clamp so the footprint stays in-bounds
    const r0 = clamp(
      baseRow - halfH,
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      baseCol - halfW,
      0,
      Math.max(0, cols - wTiles)
    );

    // Determine rotation with optional smart adjacency (square stamps only)
    const decideRotation = () => (stamp.rotation ?? gridSettings.rotation ?? 0);

    const autoRotation = naturalSettings?.randomRotation
      ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
      : decideRotation();

    const flipX = naturalSettings?.randomFlipX ? (Math.random() < 0.5) : !!(stamp.flipX ?? gridSettings.flipX);
    const flipY = naturalSettings?.randomFlipY ? (Math.random() < 0.5) : !!(stamp.flipY ?? gridSettings.flipY);
    const opacity = naturalSettings?.randomOpacity?.enabled
      ? Math.max(0.05, Math.min(1, (naturalSettings.randomOpacity.min ?? 0.05) + Math.random() * Math.max(0, (naturalSettings.randomOpacity.max ?? 1) - (naturalSettings.randomOpacity.min ?? 0.05)) ))
      : Math.max(0.05, Math.min(1, (stamp.opacity ?? gridSettings.opacity ?? 1)));

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
    // Size in tiles (rectangular via sizeCols/sizeRows)
    const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const hTiles = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));

    // Snap-like behavior when snapStep === 1 even if snapToGrid is off
    const step = gridSettings?.snapStep ?? 1;
    const snapLike = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    const baseRow = snapLike ? Math.floor(centerRow) : centerRow;
    const baseCol = snapLike ? Math.floor(centerCol) : centerCol;
    const halfH = snapLike ? Math.floor(hTiles / 2) : (hTiles / 2);
    const halfW = snapLike ? Math.floor(wTiles / 2) : (wTiles / 2);
    // Center on hovered position, clamp so full footprint stays in bounds
    let r0 = clamp(
      baseRow - halfH,
      0,
      Math.max(0, rows - hTiles)
    );
    let c0 = clamp(
      baseCol - halfW,
      0,
      Math.max(0, cols - wTiles)
    );
    // Ensure integer cell indices for tile updates
    if (!snapLike) {
      r0 = Math.round(r0);
      c0 = Math.round(c0);
      // Re-clamp after rounding
      r0 = clamp(r0, 0, Math.max(0, rows - hTiles));
      c0 = clamp(c0, 0, Math.max(0, cols - wTiles));
    }

    // Build updates for N×N
    const updates = [];
    for (let r = 0; r < hTiles; r++) {
      for (let c = 0; c < wTiles; c++) {
        updates.push({ row: r0 + r, col: c0 + c });
      }
    }

    // Opacity comes from gridSettings.opacity; color from the selected color asset (canvasColor prop)
    if (!canvasColor || selectedAsset?.kind !== 'color') return; // do not draw if no Material selected
    const a = Math.max(0.05, Math.min(1, (stamp.opacity ?? gridSettings.opacity ?? 1)));
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
    if (!selectedAsset) return;
    const baseW = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const baseH = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));
    const snap = !!gridSettings?.snapToGrid;
    if (selectedAsset.kind === 'token') {
      const wTiles = baseW;
      const hTiles = baseH;
      const r0 = clamp(
        (snap ? (centerRow - Math.floor(hTiles / 2)) : (centerRow - hTiles / 2)),
        0,
        Math.max(0, rows - hTiles)
      );
      const c0 = clamp(
        (snap ? (centerCol - Math.floor(wTiles / 2)) : (centerCol - wTiles / 2)),
        0,
        Math.max(0, cols - wTiles)
      );
      // Use the token asset's default glow if present
      const glow = selectedAsset?.glowDefault || '#7dd3fc';
      addToken?.({
        assetId: selectedAsset.id,
        row: r0,
        col: c0,
        wTiles,
        hTiles,
        rotation: (stamp.rotation ?? gridSettings.rotation ?? 0),
        flipX: !!(stamp.flipX ?? gridSettings.flipX),
        flipY: !!(stamp.flipY ?? gridSettings.flipY),
        opacity: Math.max(0.05, Math.min(1, (stamp.opacity ?? gridSettings.opacity ?? 1))),
        glowColor: glow,
        meta: { name: selectedAsset?.name || 'Token', hp: 0, initiative: 0 },
      });
      return;
    }
    if (selectedAsset.kind === 'tokenGroup' && Array.isArray(selectedAsset.members)) {
      let cursorCol = centerCol;
      const placed = [];
      for (const m of selectedAsset.members) {
        const tokAsset = assets.find((a)=> a.id === m.assetId);
        if (!tokAsset) continue;
        const wTiles = baseW;
        const hTiles = baseH;
        const r0 = clamp(
          (snap ? (centerRow - Math.floor(hTiles / 2)) : (centerRow - hTiles / 2)),
          0,
          Math.max(0, rows - hTiles)
        );
        const c0 = clamp(
          (snap ? (cursorCol - Math.floor(wTiles / 2)) : (cursorCol - wTiles / 2)),
          0,
          Math.max(0, cols - wTiles)
        );
        placed.push({ assetId: tokAsset.id, r0, c0, wTiles, hTiles, name: tokAsset.name });
        cursorCol += wTiles; // place next to the right
      }
      for (const p of placed) {
        const tokAsset = assets.find((a)=> a.id === p.assetId);
        const glow = tokAsset?.glowDefault || '#7dd3fc';
        addToken?.({
          assetId: p.assetId,
          row: p.r0,
          col: p.c0,
          wTiles: p.wTiles,
          hTiles: p.hTiles,
          rotation: (stamp.rotation ?? gridSettings.rotation ?? 0),
          flipX: !!(stamp.flipX ?? gridSettings.flipX),
          flipY: !!(stamp.flipY ?? gridSettings.flipY),
          opacity: Math.max(0.05, Math.min(1, (stamp.opacity ?? gridSettings.opacity ?? 1))),
          glowColor: glow,
          meta: { name: p.name || 'Token', hp: 0, initiative: 0 },
        });
      }
      return;
    }
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

  // Previous behavior: interactions occur over the grid overlay only

  // ===== pointer overlay
  const handlePointerDown = (e) => {
    mouseDownRef.current = true;

    // Zoom Tool: intercept interactions
    if (zoomToolActive) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xCss = e.clientX - rect.left;
      const yCss = e.clientY - rect.top;
      setMousePos({ x: xCss, y: yCss });
      const isLeft = e.button === 0 || (e.buttons & 1) === 1;
      if (!isLeft) return; // Only LMB starts rectangle zoom
      zoomDragRef.current = {
        kind: 'marquee',
        startCss: { x: xCss, y: yCss },
        curCss: { x: xCss, y: yCss },
        lastCss: { x: xCss, y: yCss },
      };
      e.preventDefault();
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    // Pan gesture: pan tool, spacebar, or middle mouse
    const isMMB = e.button === 1 || (e.buttons & 4) === 4;
    if (panToolActive || panHotkey || isMMB) {
      setIsPanning(true);
      setLastPan({ x: e.clientX, y: e.clientY });
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    // Corner resize handles should work regardless of interaction mode
    const cornerHit = hitResizeHandle(xCss, yCss);
    if (cornerHit) {
      onBeginObjectStroke?.(currentLayer);
      const o = cornerHit.sel;
      const anchor = (() => {
        if (cornerHit.corner === 'nw') return { row: o.row + o.hTiles, col: o.col + o.wTiles };
        if (cornerHit.corner === 'ne') return { row: o.row + o.hTiles, col: o.col };
        if (cornerHit.corner === 'sw') return { row: o.row, col: o.col + o.wTiles };
        return { row: o.row, col: o.col }; // 'se'
      })();
      dragRef.current = {
        kind: 'resize-obj',
        id: o.id,
        anchorRow: anchor.row,
        anchorCol: anchor.col,
        corner: cornerHit.corner,
      };
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    // Token corner resize
    const tokenCorner = hitTokenResizeHandle(xCss, yCss);
    if (tokenCorner) {
      onBeginTokenStroke?.();
      const t = tokenCorner.sel;
      const anchorT = (() => {
        if (tokenCorner.corner === 'nw') return { row: t.row + (t.hTiles || 1), col: t.col + (t.wTiles || 1) };
        if (tokenCorner.corner === 'ne') return { row: t.row + (t.hTiles || 1), col: t.col };
        if (tokenCorner.corner === 'sw') return { row: t.row, col: t.col + (t.wTiles || 1) };
        return { row: t.row, col: t.col };
      })();
      dragRef.current = { kind: 'resize-token', id: t.id, anchorRow: anchorT.row, anchorCol: anchorT.col, corner: tokenCorner.corner };
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    // Rotation ring hit
    const rotHit = hitRotateRing(xCss, yCss);
    if (rotHit) {
      onBeginObjectStroke?.(currentLayer);
      const o = rotHit.sel;
      dragRef.current = {
        kind: 'rotate-obj',
        id: o.id,
        cx: rotHit.cx,
        cy: rotHit.cy,
        startAngle: rotHit.startAngle,
        startRot: o.rotation || 0,
      };
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    // Token rotation ring hit
    const tokRot = hitTokenRotateRing(xCss, yCss);
    if (tokRot) {
      onBeginTokenStroke?.();
      const t = tokRot.sel;
      dragRef.current = { kind: 'rotate-token', id: t.id, cx: tokRot.cx, cy: tokRot.cy, startAngle: tokRot.startAngle, startRot: t.rotation || 0 };
      e.target.setPointerCapture?.(e.pointerId);
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

    // Token placement: only in draw mode and only when Token Asset menu is active
    if ((selectedAsset?.kind === 'token' || selectedAsset?.kind === 'tokenGroup') && assetGroup === 'token' && interactionMode !== 'select') {
      onBeginTokenStroke?.();
      placeTokenAt(row, col);
      return;
    }

    // Layer lock (for non-token operations)
    if (!layerIsVisible) return;

    // ===== SELECT MODE =====
    if (interactionMode === "select") {
      // Check for resize handle hit when a single object is selected
      const hit = hitResizeHandle(xCss, yCss);
      if (hit) {
        onBeginObjectStroke?.(currentLayer);
        // Anchor is opposite corner
        const o = hit.sel;
        const anchor = (() => {
          if (hit.corner === 'nw') return { row: o.row + o.hTiles, col: o.col + o.wTiles };
          if (hit.corner === 'ne') return { row: o.row + o.hTiles, col: o.col };
          if (hit.corner === 'sw') return { row: o.row, col: o.col + o.wTiles };
          return { row: o.row, col: o.col }; // 'se'
        })();
        dragRef.current = {
          kind: 'resize-obj',
          id: o.id,
          anchorRow: anchor.row,
          anchorCol: anchor.col,
          corner: hit.corner,
        };
        // ensure pointer capture for smooth resize
        e.target.setPointerCapture?.(e.pointerId);
        return;
      }
      const hitTok = getTopMostTokenAt(Math.floor(row), Math.floor(col));
      const hitObj = getTopMostObjectAt(currentLayer, Math.floor(row), Math.floor(col));

      // Prefer tokens over objects visually (tokens render on top)
      if (hitTok) {
        // Always single selection
        setSelectedObjId(null);
        setSelectedObjIds([]);
        setSelectedTokenIds([hitTok.id]);
        setSelectedTokenId(hitTok.id);
        onTokenSelectionChange?.([hitTok]);
        dragRef.current = { kind: 'token', id: hitTok.id, offsetRow: row - hitTok.row, offsetCol: col - hitTok.col };
        return;
      }

      if (hitObj) {
        // Always single selection
        onBeginObjectStroke?.(currentLayer);
        setSelectedTokenId(null);
        setSelectedTokenIds([]);
        setSelectedObjIds([hitObj.id]);
        setSelectedObjId(hitObj.id);
        onSelectionChange?.([hitObj]);
        dragRef.current = { kind: 'object', id: hitObj.id, offsetRow: row - hitObj.row, offsetCol: col - hitObj.col };
        return;
      }

      // Nothing hit: clear all selection; no marquee multi-select
      setSelectedObjId(null);
      setSelectedObjIds([]);
      onSelectionChange?.([]);
      setSelectedTokenId(null);
      setSelectedTokenIds([]);
      onTokenSelectionChange?.([]);
      dragRef.current = null;
      return; // no stamping/erasing in select mode
    }

    if (engine === "grid" || (selectedAsset?.kind === 'token' && assetGroup === 'token')) {
      setIsBrushing(true);
      lastTileRef.current = { row: -1, col: -1 };

      const hitObj = getTopMostObjectAt(currentLayer, row, col);
      // In draw mode, ignore selection/drag.
      // Stamping / Erasing
      if ((selectedAsset?.kind === 'token' || selectedAsset?.kind === 'tokenGroup') && assetGroup === 'token') {
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
      } else if (selectedAsset?.kind === 'color' && canvasColor) {
        onBeginTileStroke?.(currentLayer);
        placeGridColorStampAt(row, col);
      } else {
        // no asset or unsupported asset for grid color; do nothing
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

    // Zoom Tool move
    if (zoomToolActive) {
      if (!mouseDownRef.current) return;
      const z = zoomDragRef.current;
      if (!z) return;
      // Rectangle selection only
      z.curCss = { x: xCss, y: yCss };
      return;
    }

    // Pan drag: when pan tool, spacebar, or MMB initiated a pan
    if (isPanning && lastPan && scrollRef?.current) {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLastPan({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!mouseDownRef.current) return;
    if (!layerIsVisible) return;

    // Resize drag (runs before select-mode branch)
    if (dragRef.current && dragRef.current.kind === 'resize-obj') {
      const d = dragRef.current;
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const pr = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const pc = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

      let topRow = Math.min(d.anchorRow, pr);
      let leftCol = Math.min(d.anchorCol, pc);
      let bottomRow = Math.max(d.anchorRow, pr);
      let rightCol = Math.max(d.anchorCol, pc);
      let newH = Math.max(1, Math.round(bottomRow - topRow));
      let newW = Math.max(1, Math.round(rightCol - leftCol));

      topRow = clamp(topRow, 0, Math.max(0, rows - newH));
      leftCol = clamp(leftCol, 0, Math.max(0, cols - newW));

      const o = getObjectById(currentLayer, d.id);
      if (o) {
        updateObjectById(currentLayer, o.id, {
          row: topRow,
          col: leftCol,
          wTiles: newW,
          hTiles: newH,
        });
        setGridSettings?.((s) => ({ ...s, sizeCols: newW, sizeRows: newH }));
      }
      return;
    }

    // Resize token drag
    if (dragRef.current && dragRef.current.kind === 'resize-token') {
      const d = dragRef.current;
      let rowRaw = (yCss / cssHeight) * rows;
      let colRaw = (xCss / cssWidth) * cols;
      if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
        rowRaw = quantize(rowRaw, gridSettings.snapStep);
        colRaw = quantize(colRaw, gridSettings.snapStep);
      }
      const pr = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
      const pc = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

      let topRow = Math.min(d.anchorRow, pr);
      let leftCol = Math.min(d.anchorCol, pc);
      let bottomRow = Math.max(d.anchorRow, pr);
      let rightCol = Math.max(d.anchorCol, pc);
      let newH = Math.max(1, Math.round(bottomRow - topRow));
      let newW = Math.max(1, Math.round(rightCol - leftCol));

      topRow = clamp(topRow, 0, Math.max(0, rows - newH));
      leftCol = clamp(leftCol, 0, Math.max(0, cols - newW));

      const t = getTokenById(d.id);
      if (t) {
        updateTokenById?.(d.id, { row: topRow, col: leftCol, wTiles: newW, hTiles: newH });
      }
      return;
    }

    // Rotate drag (runs before select-mode branch)
    if (dragRef.current && dragRef.current.kind === 'rotate-obj') {
      const d = dragRef.current;
      const angle = Math.atan2(yCss - d.cy, xCss - d.cx);
      const deltaRad = angle - d.startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const o = getObjectById(currentLayer, d.id);
      if (o) {
        let next = (d.startRot + deltaDeg) % 360;
        if (next < 0) next += 360;
        const rot = Math.round(next);
        updateObjectById(currentLayer, o.id, { rotation: rot });
        setGridSettings?.((s) => ({ ...s, rotation: rot }));
      }
      return;
    }

    // Rotate token drag
    if (dragRef.current && dragRef.current.kind === 'rotate-token') {
      const d = dragRef.current;
      const angle = Math.atan2(yCss - d.cy, xCss - d.cx);
      const deltaRad = angle - d.startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const t = getTokenById(d.id);
      if (t) {
        let next = (d.startRot + deltaDeg) % 360;
        if (next < 0) next += 360;
        updateTokenById?.(d.id, { rotation: Math.round(next) });
      }
      return;
    }

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
      if (dragRef.current && dragRef.current.kind === 'object' && selectedObjId && selectedObjIds.length <= 1) {
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
      } else if (dragRef.current && dragRef.current.kind === 'token' && selectedTokenId && selectedTokenIds.length <= 1) {
        const tok = getTokenById(selectedTokenId);
        if (tok) {
          const { offsetRow, offsetCol } = dragRef.current;
          const w = tok.wTiles || 1, h = tok.hTiles || 1;
          const newRow = clamp(row - offsetRow, 0, Math.max(0, rows - h));
          const newCol = clamp(col - offsetCol, 0, Math.max(0, cols - w));
          moveToken?.(tok.id, newRow, newCol);
        }
      } else if (dragRef.current && (dragRef.current.kind === 'marquee-obj' || dragRef.current.kind === 'marquee-token')) {
        // update marquee
        dragRef.current.curRow = row;
        dragRef.current.curCol = col;
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

      // De-dupe when snapping OR when free-placement step is 1 (snap-like)
      const step = gridSettings?.snapStep ?? 1;
      const dedupeLikeSnap = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
      if (dedupeLikeSnap) {
        const keyRow = Math.floor(rowRaw);
        const keyCol = Math.floor(colRaw);
        if (keyRow === lastTileRef.current.row && keyCol === lastTileRef.current.col) return;
        lastTileRef.current = { row: keyRow, col: keyCol };
      }

      // For token assets, only place on pointer down (single-click), not on move
      if (selectedAsset?.kind === 'token' || selectedAsset?.kind === 'tokenGroup') return;

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
    // Zoom Tool finalize
    if (zoomToolActive) {
      const z = zoomDragRef.current;
      if (z && z.kind === 'marquee') {
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
      // finalize marquee selections
      if (dragRef.current.kind === 'marquee-obj' || dragRef.current.kind === 'marquee-token') {
        const { startRow, startCol, curRow, curCol } = dragRef.current;
        const r1 = Math.floor(Math.min(startRow, curRow));
        const r2 = Math.ceil(Math.max(startRow, curRow));
        const c1 = Math.floor(Math.min(startCol, curCol));
        const c2 = Math.ceil(Math.max(startCol, curCol));
        if (dragRef.current.kind === 'marquee-obj') {
          const arr = (objects[currentLayer] || []).filter((o) => {
            return !(o.row + o.hTiles <= r1 || r2 <= o.row || o.col + o.wTiles <= c1 || c2 <= o.col);
          }).map((o) => o.id);
          setSelectedObjIds(arr);
          setSelectedObjId(arr[0] || null);
          onSelectionChange?.(arr.map((id)=> getObjectById(currentLayer, id)).filter(Boolean));
        } else {
          const arr = (tokens || []).filter((t) => {
            const h = t.hTiles || 1, w = t.wTiles || 1;
            return !(t.row + h <= r1 || r2 <= t.row || t.col + w <= c1 || c2 <= t.col);
          }).map((t) => t.id);
          setSelectedTokenIds(arr);
          setSelectedTokenId(arr[0] || null);
          onTokenSelectionChange?.(arr.map((id)=> getTokenById(id)).filter(Boolean));
        }
      }
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

  // Decide cursor based on pan/select/visibility
  let cursorStyle = "default";
  if (isPanning || panHotkey || (dragRef.current && (dragRef.current.kind === 'rotate-obj' || dragRef.current.kind === 'rotate-token'))) cursorStyle = "grabbing";
  else if (panToolActive) cursorStyle = 'grab';
  else if (!layerIsVisible) cursorStyle = "not-allowed";
  else if (mousePos) {
    const hit = hitResizeHandle(mousePos.x, mousePos.y) || hitTokenResizeHandle(mousePos.x, mousePos.y);
    if (hit) {
      cursorStyle = (hit.corner === 'nw' || hit.corner === 'se') ? 'nwse-resize' : 'nesw-resize';
    } else {
      const ring = hitRotateRing(mousePos.x, mousePos.y) || hitTokenRotateRing(mousePos.x, mousePos.y);
      if (ring) cursorStyle = 'grab';
      else if (zoomToolActive) cursorStyle = 'zoom-in';
      else {
        if (engine === 'grid') cursorStyle = (gridSettings?.snapToGrid ? 'cell' : 'crosshair');
        else if (engine === 'canvas') cursorStyle = isErasing ? 'crosshair' : 'crosshair';
        else cursorStyle = 'default';
      }
    }
  } else {
    if (zoomToolActive) cursorStyle = 'zoom-in';
    else {
      if (engine === 'grid') cursorStyle = (gridSettings?.snapToGrid ? 'cell' : 'crosshair');
      else if (engine === 'canvas') cursorStyle = isErasing ? 'crosshair' : 'crosshair';
      else cursorStyle = 'default';
    }
  }

  return (
    <div className="relative inline-block" style={{ padding: 16 }}>
      <div ref={contentRef} style={{ position: "relative", width: cssWidth, height: cssHeight }}>
        {/* 1) Per-layer TILE GRIDS */}
        <TilesLayer
          maps={maps}
          rows={rows}
          cols={cols}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
          showGridLines={showGridLines}
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
          showInitiative={tokenHUDShowInitiative}
        />

        {/* 4) Selection overlay (on top of objects, below canvas) */}
        <SelectionOverlay
          objects={objects}
          currentLayer={currentLayer}
          selectedObjId={selectedObjId}
          selectedObjIds={selectedObjIds}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        {/* 4b) Token selection overlay */}
        {tokensVisible && (
          <TokenSelectionOverlay
            selectedTokenId={selectedTokenId}
            selectedTokenIds={selectedTokenIds}
            getTokenById={getTokenById}
            tileSize={tileSize}
          />
        )}

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
          isErasing={isErasing}
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

        <ActiveSelectionMiniPanel
          selectedObject={getSelectedObject()}
          selectedToken={getSelectedToken()}
          tileSize={tileSize}
          containerSize={{ w: cssWidth, h: cssHeight }}
          currentLayer={currentLayer}
          rows={rows}
          cols={cols}
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
          updateObjectById={updateObjectById}
          updateTokenById={updateTokenById}
        />

        {/* 8) Marquee overlay */}
        <MarqueeOverlay dragState={dragRef.current} tileSize={tileSize} />

        {/* 9) Zoom Tool overlays */}
        <ZoomToolOverlay active={zoomToolActive} dragState={zoomDragRef.current} />


        

      </div>
    </div>
  );
}

  


