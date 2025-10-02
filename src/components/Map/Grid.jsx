import React, { useEffect, useRef, useState } from "react";

const BASE_TILE = 32; // canvas buffer px per tile (zoom-safe)
const LAYERS = ["background", "base", "sky"];

export default function Grid({
  // tiles (multi-layer)
  maps, // { background: Grid, base: Grid, sky: Grid }
  placeTiles, // (updates:[{row,col}]) => void

  // view & tools
  tileSize = 32,
  toolMode, // 'tile_brush' | 'canvas_brush' | 'pan'
  scrollRef,
  brushSize = 1,

  // canvas paint
  canvasColor = "#cccccc",
  canvasOpacity = 0.4,
  isErasing = false,

  // layers
  canvasRefs, // { background: ref, base: ref, sky: ref }
  currentLayer = "base",
  layerVisibility = { background: true, base: true, sky: true },

  // stroke lifecycle
  onBeginTileStroke, // (layer) => void
  onBeginCanvasStroke, // (layer) => void
}) {
  const rows = maps.base.length;
  const cols = maps.base[0].length;

  const layerIsVisible = layerVisibility?.[currentLayer] !== false;

  // CSS size (what the user sees) vs buffer size (fixed pixel canvas)
  const cssWidth = cols * tileSize;
  const cssHeight = rows * tileSize;
  const bufferWidth = cols * BASE_TILE;
  const bufferHeight = rows * BASE_TILE;

  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  const mouseDownRef = useRef(false);
  const paintedPathRef = useRef(new Set());

  // Canvas brush – stamp engine state (CSS space)
  const lastStampCssRef = useRef(null); // last stamped position
  const emaCssRef = useRef(null); // smoothed pointer for stability

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

  // ===== TILE brush (grid updates on current layer)
  const applyTileBrushAt = (row, col) => {
    const half = Math.floor(brushSize / 2);
    const updates = [];
    for (let r = 0; r < brushSize; r++) {
      for (let c = 0; c < brushSize; c++) {
        const rr = row - half + r;
        const cc = col - half + c;
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
          updates.push({ row: rr, col: cc });
        }
      }
    }
    if (updates.length) placeTiles(updates);
  };

  // ===== CANVAS brush (stamp engine in CSS space)
  const stampDiscAt = (cssPt) => {
    const ctx = getActiveCtx();
    if (!ctx || !cssPt) return;
    const p = toCanvasCoords(cssPt.x, cssPt.y);

    ctx.save();
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : "source-over";
    ctx.fillStyle = isErasing
      ? "rgba(0,0,0,1)"
      : hexToRgba(canvasColor, canvasOpacity);
    ctx.beginPath();
    ctx.arc(p.x, p.y, (brushSize * BASE_TILE) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // lay stamps along segment a -> b with tight spacing
  const stampBetween = (a, b) => {
    const radiusCss = (brushSize * tileSize) / 2;
    const spacing = Math.max(1, radiusCss * 0.27); // ~27% of radius -> solid ribbon
    const d = dist(a, b);
    if (d <= spacing) {
      stampDiscAt(b);
      return;
    }
    const steps = Math.ceil(d / spacing);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      stampDiscAt(lerp(a, b, t));
    }
  };

  // ===== global pointerup
  useEffect(() => {
    const up = () => {
      mouseDownRef.current = false;
      setIsBrushing(false);
      setIsPanning(false);
      setLastPan(null);
      paintedPathRef.current.clear();
      lastStampCssRef.current = null;
      emaCssRef.current = null;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  // ===== pointer overlay
  const handlePointerDown = (e) => {
    mouseDownRef.current = true;

    if (toolMode === "pan") {
      setIsPanning(true);
      setLastPan({ x: e.clientX, y: e.clientY });
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;

    // lock when layer hidden
    if (
      (toolMode === "tile_brush" || toolMode === "canvas_brush") &&
      !layerIsVisible
    )
      return;

    setMousePos({ x: xCss, y: yCss });

    const row = Math.floor((yCss / cssHeight) * rows);
    const col = Math.floor((xCss / cssWidth) * cols);

    if (toolMode === "tile_brush") {
      onBeginTileStroke?.(currentLayer); // snapshot once at stroke start
      setIsBrushing(true);
      applyTileBrushAt(row, col);
      return;
    }

    if (toolMode === "canvas_brush") {
      onBeginCanvasStroke?.(currentLayer); // snapshot BEFORE any paint
      setIsBrushing(true);

      // init smoothing
      const start = { x: xCss, y: yCss };
      emaCssRef.current = start;
      lastStampCssRef.current = start;

      // solid start
      stampDiscAt(start);
      return;
    }
  };

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;

    // lock when layer hidden (but allow pan)
    if (
      (toolMode === "tile_brush" || toolMode === "canvas_brush") &&
      !layerIsVisible
    )
      return;

    setMousePos({ x: xCss, y: yCss });

    if (toolMode === "pan" && isPanning && lastPan && scrollRef?.current) {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLastPan({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!mouseDownRef.current) return;

    if (toolMode === "tile_brush") {
      const row = Math.floor((yCss / cssHeight) * rows);
      const col = Math.floor((xCss / cssWidth) * cols);
      applyTileBrushAt(row, col);
      return;
    }

    if (toolMode === "canvas_brush") {
      // Use native event for coalesced points
      const native = e.nativeEvent;
      const events =
        typeof native.getCoalescedEvents === "function"
          ? native.getCoalescedEvents()
          : [native];

      // smoothing (0..1). Higher = snappier, Lower = smoother.
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
          stampDiscAt(init);
          continue;
        }

        // EMA smoothing
        ema = {
          x: ema.x + (px - ema.x) * alpha,
          y: ema.y + (py - ema.y) * alpha,
        };

        // lay tightly-spaced stamps between last and ema
        stampBetween(last, ema);
        last = ema;
      }

      lastStampCssRef.current = last;
      emaCssRef.current = ema;
      return;
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture?.(e.pointerId);
    if (toolMode === "canvas_brush") {
      const end = emaCssRef.current || lastStampCssRef.current;
      if (end) stampDiscAt(end); // tidy finish
    }
  };

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
              zIndex: 10 + i * 10,
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
                rowArr.map((tile, ci) => {
                  const bg =
                    tile === "grass"
                      ? "green"
                      : tile === "water"
                      ? "blue"
                      : tile === "stone"
                      ? "gray"
                      : "transparent";
                  return (
                    <div
                      key={`${layer}-${ri}-${ci}`}
                      className="border border-gray-600"
                      style={{
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: bg,
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        ))}

        {/* 2) Per-layer CANVASES, stacked with their tile grids */}
        {LAYERS.map((layer, i) => (
          <canvas
            key={`canvas-${layer}`}
            ref={canvasRefs?.[layer]}
            width={bufferWidth}
            height={bufferHeight}
            style={{
              width: cssWidth,
              height: cssHeight,
              zIndex: 11 + i * 10,
              display: layerVisibility[layer] ? "block" : "none",
            }}
            className="absolute top-0 left-0 pointer-events-none"
          />
        ))}

        {/* 3) Canvas brush cursor preview */}
        {toolMode === "canvas_brush" && layerIsVisible && mousePos && (
          <div
            className="absolute rounded-full border border-white pointer-events-none"
            style={{
              left: mousePos.x - brushSize * tileSize * 0.5,
              top: mousePos.y - brushSize * tileSize * 0.5,
              width: brushSize * tileSize,
              height: brushSize * tileSize,
              zIndex: 50,
              backgroundColor: hexToRgba(canvasColor, 0.1),
            }}
          />
        )}

        {/* 4) Single invisible POINTER OVERLAY */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: cssWidth,
            height: cssHeight,
            zIndex: 60,
            cursor:
              toolMode === "pan"
                ? "grab"
                : layerIsVisible
                ? "crosshair"
                : "not-allowed",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
