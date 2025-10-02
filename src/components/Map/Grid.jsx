import React, { useEffect, useRef, useState } from "react";

const BASE_TILE = 32; // canvas buffer px per tile (zoom-safe)
const LAYERS = ["background", "base", "sky"];

export default function Grid({
  // tiles (multi-layer)
  maps, // { background: Grid, base: Grid, sky: Grid }
  placeTiles, // (updates:[{row,col}]) => void

  // view & tools
  tileSize = 32,
  toolMode,
  scrollRef,
  brushSize = 1,

  // canvas paint
  canvasColor = "#cccccc",
  canvasOpacity = 0.4,
  isErasing = false,

  // layers
  canvasRefs, // { background: ref, base: ref, sky: ref }
  currentLayer = "base",
  layerVisibility = { background: true, base: true, sky: true }, // NEW

  // stroke lifecycle
  onBeginTileStroke, // (layer) => void
  onBeginCanvasStroke, // (layer) => void
}) {
  const rows = maps.base.length;
  const cols = maps.base[0].length;

  const layerIsVisible = layerVisibility?.[currentLayer] !== false;

  const cssWidth = cols * tileSize;
  const cssHeight = rows * tileSize;
  const bufferWidth = cols * BASE_TILE;
  const bufferHeight = rows * BASE_TILE;

  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  const mouseDownRef = useRef(false);
  const lastPaintPosRef = useRef(null);
  const paintedPathRef = useRef(new Set());

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

  const stampAt = (row, col) => {
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

  const drawCanvasStroke = (fromCss, toCss) => {
    const ctx = getActiveCtx();
    if (!ctx || !fromCss || !toCss) return;

    const from = toCanvasCoords(fromCss.x, fromCss.y);
    const to = toCanvasCoords(toCss.x, toCss.y);

    const zoneKey = `${Math.floor(to.x)}-${Math.floor(to.y)}-${brushSize}`;
    if (paintedPathRef.current.has(zoneKey)) return;
    paintedPathRef.current.add(zoneKey);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = brushSize * BASE_TILE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : "source-over";
    ctx.strokeStyle = isErasing
      ? "rgba(0,0,0,1)"
      : hexToRgba(canvasColor, canvasOpacity);
    ctx.stroke();
    ctx.restore();
  };

  // ===== global pointerup
  useEffect(() => {
    const up = () => {
      mouseDownRef.current = false;
      setIsBrushing(false);
      setIsPanning(false);
      setLastPan(null);
      lastPaintPosRef.current = null;
      paintedPathRef.current.clear();
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
    if (
      (toolMode === "tile_brush" || toolMode === "canvas_brush") &&
      !layerIsVisible
    ) {
      // layer is hidden -> locked from editing
      return;
    }
    setMousePos({ x: xCss, y: yCss });

    const row = Math.floor((yCss / cssHeight) * rows);
    const col = Math.floor((xCss / cssWidth) * cols);

    if (toolMode === "tile_brush") {
      onBeginTileStroke?.(currentLayer); // snapshot once at stroke start
      setIsBrushing(true);
      stampAt(row, col);
      return;
    }

    if (toolMode === "canvas_brush") {
      onBeginCanvasStroke?.(currentLayer); // snapshot BEFORE paint
      setIsBrushing(true);
      lastPaintPosRef.current = { x: xCss, y: yCss };
      paintedPathRef.current.clear();

      // single click dot
      const ctx = getActiveCtx();
      if (ctx) {
        const p = toCanvasCoords(xCss, yCss);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.lineWidth = brushSize * BASE_TILE;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = isErasing
          ? "destination-out"
          : "source-over";
        ctx.strokeStyle = isErasing
          ? "rgba(0,0,0,1)"
          : hexToRgba(canvasColor, canvasOpacity);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    if (
      (toolMode === "tile_brush" || toolMode === "canvas_brush") &&
      !layerIsVisible
    ) {
      // allow pan to keep working, but block brushes
      return;
    }
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
      stampAt(row, col);
      return;
    }

    if (toolMode === "canvas_brush") {
      const last = lastPaintPosRef.current;
      drawCanvasStroke(last, { x: xCss, y: yCss });
      lastPaintPosRef.current = { x: xCss, y: yCss };
      return;
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture?.(e.pointerId);
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
              display: layerVisibility[layer] ? "block" : "none", // NEW
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
              display: layerVisibility[layer] ? "block" : "none", // NEW
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
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
