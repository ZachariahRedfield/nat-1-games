import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

const Grid = forwardRef(function Grid(
  {
    map,
    placeTiles,
    tileSize = 32,
    toolMode,
    scrollRef,
    brushSize = 1,
    canvasColor = "#cccccc",
    canvasOpacity = 0.4,
    isErasing = false,
    onCanvasChange,
    canvasRef,
  },
  ref
) {
  if (!map?.length || !map[0]?.length) {
    return <div className="text-red-500">⚠️ Map data is invalid</div>;
  }

  const rows = map.length;
  const cols = map[0].length;
  const width = cols * tileSize;
  const height = rows * tileSize;

  const [isPanning, setIsPanning] = useState(false);
  const [last, setLast] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [hoverTile, setHoverTile] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const internalCanvasRef = useRef(null);
  const paintedPathRef = useRef(new Set());
  const mouseDownRef = useRef(false);
  const lastPaintPosRef = useRef(null);

  // expose the canvas to parent
  useImperativeHandle(canvasRef, () => internalCanvasRef.current, []);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      mouseDownRef.current = false;
      setIsBrushing(false);
      lastPaintPosRef.current = null;
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, []);

  useEffect(() => {
    if (toolMode === "tile_brush" && isBrushing && hoverTile) {
      const [centerRow, centerCol] = hoverTile;
      const half = Math.floor(brushSize / 2);
      const updates = [];
      for (let r = 0; r < brushSize; r++) {
        for (let c = 0; c < brushSize; c++) {
          const targetRow = centerRow - half + r;
          const targetCol = centerCol - half + c;
          if (map[targetRow]?.[targetCol] !== undefined) {
            updates.push({ row: targetRow, col: targetCol });
          }
        }
      }
      if (updates.length) placeTiles(updates);
    }
  }, [hoverTile, isBrushing, toolMode, brushSize]);

  const drawStroke = (from, to) => {
    const ctx = internalCanvasRef.current?.getContext("2d");
    if (!ctx || !from || !to) return;

    const zoneKey = `${Math.floor(to.x)}-${Math.floor(to.y)}-${brushSize}`;
    if (paintedPathRef.current.has(zoneKey)) return;
    paintedPathRef.current.add(zoneKey);

    // Snapshot before first stroke in a path
    if (onCanvasChange && paintedPathRef.current.size === 1) {
      onCanvasChange(internalCanvasRef.current.toDataURL());
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = brushSize * tileSize;
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

  const handlePointerDown = (e) => {
    mouseDownRef.current = true;

    if (toolMode === "pan") {
      setIsPanning(true);
      setLast({ x: e.clientX, y: e.clientY });
      e.target.setPointerCapture?.(e.pointerId);
    } else if (toolMode === "canvas_brush") {
      setIsBrushing(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      lastPaintPosRef.current = { x, y };
      paintedPathRef.current.clear();

      // Snapshot before dot
      if (onCanvasChange) {
        onCanvasChange(internalCanvasRef.current.toDataURL());
      }

      const ctx = internalCanvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.lineWidth = brushSize * tileSize;
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
    if (toolMode === "pan" && isPanning && last && scrollRef?.current) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      scrollRef.current.scrollBy({ left: -dx, top: -dy });
      setLast({ x: e.clientX, y: e.clientY });
    }

    if (toolMode === "canvas_brush") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (mouseDownRef.current) {
        setIsBrushing(true);
        const last = lastPaintPosRef.current;
        drawStroke(last, { x, y });
        lastPaintPosRef.current = { x, y };
      }
    }
  };

  const handlePointerUp = (e) => {
    setIsBrushing(false);
    setIsPanning(false);
    setLast(null);
    mouseDownRef.current = false;
    lastPaintPosRef.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  const hexToRgba = (hex, opacity) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${opacity})`;
  };

  return (
    <div
      className="relative inline-block"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        cursor: toolMode === "pan" ? "grab" : "default",
        padding: "16px",
      }}
    >
      <div style={{ position: "relative", width, height }}>
        <canvas
          ref={internalCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-10 pointer-events-none"
        />

        {toolMode === "canvas_brush" && mousePos && (
          <div
            className="absolute rounded-full border border-white pointer-events-none"
            style={{
              left: mousePos.x - brushSize * tileSize * 0.5,
              top: mousePos.y - brushSize * tileSize * 0.5,
              width: brushSize * tileSize,
              height: brushSize * tileSize,
              zIndex: 20,
              backgroundColor: hexToRgba(canvasColor, 0.1),
            }}
          />
        )}

        <div
          className="grid relative z-0"
          style={{
            width: `${cols * tileSize}px`,
            height: `${rows * tileSize}px`,
            gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
            gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
          }}
        >
          {map.map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`${ri}-${ci}`}
                onMouseDown={() => {
                  if (toolMode === "tile_brush") {
                    setIsBrushing(true);
                    setHoverTile([ri, ci]);
                  }
                }}
                onMouseEnter={() => {
                  setHoverTile([ri, ci]);
                }}
                className="border border-gray-600 relative"
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  backgroundColor:
                    cell === "grass"
                      ? "green"
                      : cell === "water"
                      ? "blue"
                      : cell === "stone"
                      ? "gray"
                      : "transparent",
                }}
              >
                {toolMode === "tile_brush" &&
                  hoverTile?.[0] === ri &&
                  hoverTile?.[1] === ci && (
                    <div
                      className="absolute border border-white opacity-50 pointer-events-none"
                      style={{
                        left: `${-(Math.floor(brushSize / 2) * tileSize)}px`,
                        top: `${-(Math.floor(brushSize / 2) * tileSize)}px`,
                        width: `${brushSize * tileSize}px`,
                        height: `${brushSize * tileSize}px`,
                        boxSizing: "border-box",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        zIndex: 10,
                      }}
                    />
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export default Grid;
