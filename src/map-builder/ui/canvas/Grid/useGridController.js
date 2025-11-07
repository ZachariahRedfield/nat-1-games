import { useEffect, useRef, useState } from "react";
import { BASE_TILE, clamp, hexToRgba, dist, lerp } from "./utils";
import useGridSelection from "./selection/useGridSelection.js";

const DEFAULT_LAYER_VISIBILITY = { background: true, base: true, sky: true };
const DEFAULT_NATURAL_SETTINGS = {
  randomRotation: false,
  randomFlipX: false,
  randomFlipY: false,
  randomSize: { enabled: false, min: 1, max: 1 },
  randomOpacity: { enabled: false, min: 1, max: 1 },
  randomVariant: true,
};

export function useGridController({
  maps,
  objects,
  assets,
  engine,
  selectedAsset,
  gridSettings,
  stampSettings = null,
  setGridSettings,
  brushSize = 2,
  canvasOpacity = 0.35,
  canvasColor = null,
  canvasSpacing = 0.27,
  canvasBlendMode = "source-over",
  canvasSmoothing = 0.55,
  naturalSettings = DEFAULT_NATURAL_SETTINGS,
  isErasing = false,
  interactionMode = "draw",
  tileSize = 32,
  scrollRef,
  contentRef, // kept for API parity even though controller does not use it directly
  canvasRefs,
  currentLayer = "base",
  layerVisibility = DEFAULT_LAYER_VISIBILITY,
  tokensVisible = true,
  tokenHUDVisible = true,
  tokenHUDShowInitiative = false,
  assetGroup = "image",
  showGridLines = true,
  zoomToolActive = false,
  panToolActive = false,
  onZoomToolRect,
  onBeginTileStroke,
  onBeginCanvasStroke,
  onBeginObjectStroke,
  onBeginTokenStroke,
  placeTiles,
  addObject,
  eraseObjectAt,
  moveObject,
  removeObjectById,
  updateObjectById,
  onSelectionChange,
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

  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const [panHotkey, setPanHotkey] = useState(false);

  const mouseDownRef = useRef(false);
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);
  const lastTileRef = useRef({ row: -1, col: -1 });
  const zoomDragRef = useRef(null);
  const dragRef = useRef(null);

  const stamp = stampSettings || gridSettings || {};

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

  const quantize = (v, step) => {
    if (!step || step <= 0) return v;
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

    const updates = [];
    for (let r = 0; r < hTiles; r++) {
      for (let c = 0; c < wTiles; c++) {
        updates.push({ row: r0 + r, col: c0 + c });
      }
    }
    placeTiles(updates);

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

  const hitResizeHandle = (xCss, yCss) => {
    const sel = getSelectedObject();
    if (!sel) return null;
    const left = sel.col * tileSize;
    const top = sel.row * tileSize;
    const w = sel.wTiles * tileSize;
    const h = sel.hTiles * tileSize;
    const sz = 10;
    const within = (cx, cy) => Math.abs(xCss - cx) <= sz && Math.abs(yCss - cy) <= sz;
    const corners = [
      { corner: "nw", x: left, y: top },
      { corner: "ne", x: left + w, y: top },
      { corner: "sw", x: left, y: top + h },
      { corner: "se", x: left + w, y: top + h },
    ];
    for (const c of corners) {
      if (within(c.x, c.y)) return { sel, corner: c.corner };
    }
    return null;
  };

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
    const distance = Math.sqrt(dx * dx + dy * dy);
    const tol = 8;
    if (distance >= r - tol && distance <= r + tol) {
      const angle = Math.atan2(dy, dx);
      return { sel, cx, cy, startAngle: angle };
    }
    return null;
  };

  const hitTokenResizeHandle = (xCss, yCss) => {
    const sel = getSelectedToken();
    if (!sel) return null;
    const left = sel.col * tileSize;
    const top = sel.row * tileSize;
    const w = (sel.wTiles || 1) * tileSize;
    const h = (sel.hTiles || 1) * tileSize;
    const sz = 10;
    const within = (cx, cy) => Math.abs(xCss - cx) <= sz && Math.abs(yCss - cy) <= sz;
    const corners = [
      { corner: "nw", x: left, y: top },
      { corner: "ne", x: left + w, y: top },
      { corner: "sw", x: left, y: top + h },
      { corner: "se", x: left + w, y: top + h },
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
    const distance = Math.sqrt(dx * dx + dy * dy);
    const tol = 8;
    if (distance >= r - tol && distance <= r + tol) {
      const angle = Math.atan2(dy, dx);
      return { sel, cx, cy, startAngle: angle };
    }
    return null;
  };

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
      const img = selectedAsset.img;
      const pxSize = brushSize * BASE_TILE;
      ctx.translate(p.x, p.y);
      const rot = (((stamp?.rotation ?? gridSettings?.rotation) || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale((stamp?.flipX ?? gridSettings?.flipX) ? -1 : 1, (stamp?.flipY ?? gridSettings?.flipY) ? -1 : 1);
      ctx.drawImage(img, -pxSize / 2, -pxSize / 2, pxSize, pxSize);
    } else {
      if (!canvasColor || selectedAsset?.kind !== "color") {
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
    const spacing = Math.max(1, radiusCss * canvasSpacing);
    const distance = dist(a, b);
    if (distance <= spacing) {
      paintTipAt(b);
      return;
    }
    const steps = Math.ceil(distance / spacing);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      paintTipAt(lerp(a, b, t));
    }
  };

  const placeGridImageAt = (centerRow, centerCol) => {
    if (!selectedAsset || (selectedAsset.kind !== "image" && selectedAsset.kind !== "natural")) return;

    const isNatural = selectedAsset.kind === "natural";
    const variants = isNatural ? selectedAsset.variants || [] : null;
    const chooseVariantIndex = () => {
      if (!isNatural) return undefined;
      const n = variants?.length || 0;
      if (n <= 0) return 0;
      if (naturalSettings?.randomVariant) return Math.floor(Math.random() * n);
      return 0;
    };
    const variantIndex = chooseVariantIndex();
    const variantAspect = isNatural
      ? variants?.[variantIndex || 0]?.aspectRatio || 1
      : selectedAsset.aspectRatio || 1;

    const aspect = variantAspect;
    const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const hTiles = Math.max(1, Math.round((stamp.sizeRows ?? Math.round(wTiles / aspect))));

    const step = gridSettings?.snapStep ?? 1;
    const snapLike = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    const baseRow = snapLike ? Math.floor(centerRow) : centerRow;
    const baseCol = snapLike ? Math.floor(centerCol) : centerCol;
    const halfH = snapLike ? Math.floor(hTiles / 2) : hTiles / 2;
    const halfW = snapLike ? Math.floor(wTiles / 2) : wTiles / 2;
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

    const decideRotation = () => stamp.rotation ?? gridSettings.rotation ?? 0;

    const autoRotation = naturalSettings?.randomRotation
      ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
      : decideRotation();

    const flipX = naturalSettings?.randomFlipX ? Math.random() < 0.5 : !!(stamp.flipX ?? gridSettings.flipX);
    const flipY = naturalSettings?.randomFlipY ? Math.random() < 0.5 : !!(stamp.flipY ?? gridSettings.flipY);
    const opacity = naturalSettings?.randomOpacity?.enabled
      ? Math.max(
          0.05,
          Math.min(
            1,
            (naturalSettings.randomOpacity.min ?? 0.05) +
              Math.random() *
                Math.max(0, (naturalSettings.randomOpacity.max ?? 1) - (naturalSettings.randomOpacity.min ?? 0.05))
          )
        )
      : Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1));

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
    const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const hTiles = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));

    const step = gridSettings?.snapStep ?? 1;
    const snapLike = !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    const baseRow = snapLike ? Math.floor(centerRow) : centerRow;
    const baseCol = snapLike ? Math.floor(centerCol) : centerCol;
    const halfH = snapLike ? Math.floor(hTiles / 2) : hTiles / 2;
    const halfW = snapLike ? Math.floor(wTiles / 2) : wTiles / 2;
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
    if (!snapLike) {
      r0 = clamp(Math.round(r0), 0, Math.max(0, rows - hTiles));
      c0 = clamp(Math.round(c0), 0, Math.max(0, cols - wTiles));
    }

    const updates = [];
    for (let r = 0; r < hTiles; r++) {
      for (let c = 0; c < wTiles; c++) {
        updates.push({ row: r0 + r, col: c0 + c });
      }
    }

    if (!canvasColor || selectedAsset?.kind !== "color") return;
    const a = Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1));
    const rgba = hexToRgba(canvasColor, a);
    placeTiles(updates, rgba);
  };

  const eraseGridAt = (row, col) => {
    const hit = getTopMostObjectAt(currentLayer, row, col);
    if (hit) {
      eraseObjectAt(currentLayer, row, col);
    } else {
      placeTiles([{ row, col }]);
    }
  };

  const placeTokenAt = (centerRow, centerCol) => {
    if (!selectedAsset) return;
    const baseW = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
    const baseH = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));
    const snap = !!gridSettings?.snapToGrid;
    if (selectedAsset.kind === "token") {
      const wTiles = baseW;
      const hTiles = baseH;
      const r0 = clamp(
        snap ? centerRow - Math.floor(hTiles / 2) : centerRow - hTiles / 2,
        0,
        Math.max(0, rows - hTiles)
      );
      const c0 = clamp(
        snap ? centerCol - Math.floor(wTiles / 2) : centerCol - wTiles / 2,
        0,
        Math.max(0, cols - wTiles)
      );
      const glow = selectedAsset?.glowDefault || "#7dd3fc";
      addToken?.({
        assetId: selectedAsset.id,
        row: r0,
        col: c0,
        wTiles,
        hTiles,
        rotation: stamp.rotation ?? gridSettings.rotation ?? 0,
        flipX: !!(stamp.flipX ?? gridSettings.flipX),
        flipY: !!(stamp.flipY ?? gridSettings.flipY),
        opacity: Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1)),
        glowColor: glow,
        meta: { name: selectedAsset?.name || "Token", hp: 0, initiative: 0 },
      });
      return;
    }
    if (selectedAsset.kind === "tokenGroup" && Array.isArray(selectedAsset.members)) {
      let cursorCol = centerCol;
      const placed = [];
      for (const m of selectedAsset.members) {
        const tokAsset = assets.find((a) => a.id === m.assetId);
        if (!tokAsset) continue;
        const wTiles = baseW;
        const hTiles = baseH;
        const r0 = clamp(
          snap ? centerRow - Math.floor(hTiles / 2) : centerRow - hTiles / 2,
          0,
          Math.max(0, rows - hTiles)
        );
        const c0 = clamp(
          snap ? cursorCol - Math.floor(wTiles / 2) : cursorCol - wTiles / 2,
          0,
          Math.max(0, cols - wTiles)
        );
        placed.push({ assetId: tokAsset.id, r0, c0, wTiles, hTiles, name: tokAsset.name });
        cursorCol += wTiles;
      }
      for (const p of placed) {
        const tokAsset = assets.find((a) => a.id === p.assetId);
        const glow = tokAsset?.glowDefault || "#7dd3fc";
        addToken?.({
          assetId: p.assetId,
          row: p.r0,
          col: p.c0,
          wTiles: p.wTiles,
          hTiles: p.hTiles,
          rotation: stamp.rotation ?? gridSettings.rotation ?? 0,
          flipX: !!(stamp.flipX ?? gridSettings.flipX),
          flipY: !!(stamp.flipY ?? gridSettings.flipY),
          opacity: Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1)),
          glowColor: glow,
          meta: { name: p.name || "Token", hp: 0, initiative: 0 },
        });
      }
    }
  };

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

  const handlePointerDown = (e) => {
    mouseDownRef.current = true;

    if (zoomToolActive) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xCss = e.clientX - rect.left;
      const yCss = e.clientY - rect.top;
      setMousePos({ x: xCss, y: yCss });
      const isLeft = e.button === 0 || (e.buttons & 1) === 1;
      if (!isLeft) return;
      zoomDragRef.current = {
        kind: "marquee",
        startCss: { x: xCss, y: yCss },
        curCss: { x: xCss, y: yCss },
        lastCss: { x: xCss, y: yCss },
      };
      e.preventDefault();
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

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
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    const tokenCorner = hitTokenResizeHandle(xCss, yCss);
    if (tokenCorner) {
      onBeginTokenStroke?.();
      const t = tokenCorner.sel;
      const anchorT = (() => {
        if (tokenCorner.corner === "nw") return { row: t.row + (t.hTiles || 1), col: t.col + (t.wTiles || 1) };
        if (tokenCorner.corner === "ne") return { row: t.row + (t.hTiles || 1), col: t.col };
        if (tokenCorner.corner === "sw") return { row: t.row, col: t.col + (t.wTiles || 1) };
        return { row: t.row, col: t.col };
      })();
      dragRef.current = { kind: "resize-token", id: t.id, anchorRow: anchorT.row, anchorCol: anchorT.col, corner: tokenCorner.corner };
      e.target.setPointerCapture?.(e.pointerId);
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
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    const tokRot = hitTokenRotateRing(xCss, yCss);
    if (tokRot) {
      onBeginTokenStroke?.();
      const t = tokRot.sel;
      dragRef.current = { kind: "rotate-token", id: t.id, cx: tokRot.cx, cy: tokRot.cy, startAngle: tokRot.startAngle, startRot: t.rotation || 0 };
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

    if ((selectedAsset?.kind === "token" || selectedAsset?.kind === "tokenGroup") && assetGroup === "token" && interactionMode !== "select") {
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
        e.target.setPointerCapture?.(e.pointerId);
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
        dragRef.current = { kind: "token", id: hitTok.id, offsetRow: row - hitTok.row, offsetCol: col - hitTok.col };
        return;
      }

      if (hitObj) {
        onBeginObjectStroke?.(currentLayer);
        setSelectedTokenId(null);
        setSelectedTokenIds([]);
        setSelectedObjIds([hitObj.id]);
        setSelectedObjId(hitObj.id);
        onSelectionChange?.([hitObj]);
        dragRef.current = { kind: "object", id: hitObj.id, offsetRow: row - hitObj.row, offsetCol: col - hitObj.col };
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

        eraseGridStampAt(Math.floor(row), Math.floor(col), {
          rows,
          cols,
          gridSettings,
          objects,
          currentLayer,
          placeTiles,
          removeObjectById,
        });
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

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    setMousePos({ x: xCss, y: yCss });

    if (zoomToolActive) {
      if (!mouseDownRef.current) return;
      const z = zoomDragRef.current;
      if (!z) return;
      z.curCss = { x: xCss, y: yCss };
      return;
    }

    if (isPanning && lastPan && scrollRef?.current) {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLastPan({ x: e.clientX, y: e.clientY });
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
        setGridSettings?.((s) => ({ ...s, sizeCols: newW, sizeRows: newH }));
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

      const t = getTokenById(dragRef.current.id);
      if (t) {
        updateTokenById?.(dragRef.current.id, { row: topRow, col: leftCol, wTiles: newW, hTiles: newH });
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
        setGridSettings?.((s) => ({ ...s, rotation: rot }));
      }
      return;
    }

    if (dragRef.current && dragRef.current.kind === "rotate-token") {
      const angle = Math.atan2(yCss - dragRef.current.cy, xCss - dragRef.current.cx);
      const deltaRad = angle - dragRef.current.startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      const t = getTokenById(dragRef.current.id);
      if (t) {
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
          const w = tok.wTiles || 1;
          const h = tok.hTiles || 1;
          const newRow = clamp(row - offsetRow, 0, Math.max(0, rows - h));
          const newCol = clamp(col - offsetCol, 0, Math.max(0, cols - w));
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
        eraseGridStampAt(row, col, {
          rows,
          cols,
          gridSettings,
          objects,
          currentLayer,
          placeTiles,
          removeObjectById,
        });
      } else if (selectedAsset?.kind === "image" || selectedAsset?.kind === "natural") {
        placeGridImageAt(row, col);
      } else {
        placeGridColorStampAt(row, col);
      }
      return;
    }

    if (engine === "canvas") {
      const native = e.nativeEvent;
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

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture?.(e.pointerId);
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
          onSelectionChange?.(arr.map((id) => getObjectById(currentLayer, id)).filter(Boolean));
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
          onTokenSelectionChange?.(arr.map((id) => getTokenById(id)).filter(Boolean));
        }
      }
      dragRef.current = null;
    }
  };

  const cellBg = (v) => {
    if (!v) return "transparent";
    if (typeof v === "string") {
      if (v.startsWith("rgba(") || v.startsWith("rgb(")) return v;
      if (v.startsWith("#")) return v;
    }
    return v === "grass"
      ? "green"
      : v === "water"
      ? "blue"
      : v === "stone"
      ? "gray"
      : "transparent";
  };

  let cursorStyle = "default";
  if (isPanning || panHotkey || (dragRef.current && (dragRef.current.kind === "rotate-obj" || dragRef.current.kind === "rotate-token"))) {
    cursorStyle = "grabbing";
  } else if (panToolActive) {
    cursorStyle = "grab";
  } else if (!layerIsVisible) {
    cursorStyle = "not-allowed";
  } else if (mousePos) {
    const hit = hitResizeHandle(mousePos.x, mousePos.y) || hitTokenResizeHandle(mousePos.x, mousePos.y);
    if (hit) {
      cursorStyle = hit.corner === "nw" || hit.corner === "se" ? "nwse-resize" : "nesw-resize";
    } else {
      const ring = hitRotateRing(mousePos.x, mousePos.y) || hitTokenRotateRing(mousePos.x, mousePos.y);
      if (ring) cursorStyle = "grab";
      else if (zoomToolActive) cursorStyle = "zoom-in";
      else cursorStyle = engine === "grid" ? (gridSettings?.snapToGrid ? "cell" : "crosshair") : "crosshair";
    }
  } else {
    if (zoomToolActive) cursorStyle = "zoom-in";
    else cursorStyle = engine === "grid" ? (gridSettings?.snapToGrid ? "cell" : "crosshair") : "crosshair";
  }

  return {
    rows,
    cols,
    cssWidth,
    cssHeight,
    bufferWidth,
    bufferHeight,
    layerIsVisible,
    mousePos,
    cursorStyle,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getTokenById,
    dragRef,
    zoomDragRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cellBg,
  };
}

export default useGridController;
