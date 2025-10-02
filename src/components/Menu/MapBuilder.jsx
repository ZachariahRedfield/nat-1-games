import React, { useRef, useState } from "react";
import Grid from "../Map/Grid";
import Toolbar from "../Map/Toolbar";

const LAYERS = ["background", "base", "sky"];

const makeGrid = (rows, cols, fill = null) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

const deepCopyGrid = (g) => g.map((row) => [...row]);

export default function MapBuilder({ goBack }) {
  // --- dimensions ---
  const [rowsInput, setRowsInput] = useState("20");
  const [colsInput, setColsInput] = useState("20");
  const rows = Math.max(1, Math.min(200, parseInt(rowsInput) || 20));
  const cols = Math.max(1, Math.min(200, parseInt(colsInput) || 20));

  // --- per-layer tile maps ---
  const [maps, setMaps] = useState({
    background: makeGrid(rows, cols),
    base: makeGrid(rows, cols),
    sky: makeGrid(rows, cols),
  });

  const [selectedTile, setSelectedTile] = useState("grass");
  const [tileSize, setTileSize] = useState(32);
  const scrollRef = useRef(null);

  // --- tools ---
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolMode, setToolMode] = useState("tile_brush"); // 'tile_brush' | 'canvas_brush' | 'pan'
  const [brushSize, setBrushSize] = useState(1);
  const [canvasColor, setCanvasColor] = useState("#cccccc");
  const [canvasOpacity, setCanvasOpacity] = useState(0.4);
  const [isErasing, setIsErasing] = useState(false);

  // --- layers ---
  const [currentLayer, setCurrentLayer] = useState("base");
  const canvasRefs = {
    background: useRef(null),
    base: useRef(null),
    sky: useRef(null),
  };
  const [layerVisibility, setLayerVisibility] = useState({
    background: true,
    base: true,
    sky: true,
  });

  // --- undo/redo stacks ---
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ---- helpers ----
  const resizeLayer = (grid, r, c) =>
    Array.from({ length: r }, (_, ri) =>
      Array.from({ length: c }, (_, ci) => grid[ri]?.[ci] ?? null)
    );

  const updateGridSizes = () => {
    const r = Math.max(1, Math.min(200, parseInt(rowsInput) || 20));
    const c = Math.max(1, Math.min(200, parseInt(colsInput) || 20));
    setMaps((prev) => ({
      background: resizeLayer(prev.background, r, c),
      base: resizeLayer(prev.base, r, c),
      sky: resizeLayer(prev.sky, r, c),
    }));
  };

  // ---- stroke lifecycle hooks (called by Grid) ----
  const onBeginTileStroke = (layer) => {
    setUndoStack((prev) => [
      ...prev,
      { type: "tilemap", layer, map: deepCopyGrid(maps[layer]) },
    ]);
    setRedoStack([]);
  };

  const onBeginCanvasStroke = (layer) => {
    const canvas = canvasRefs[layer]?.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    setUndoStack((prev) => [...prev, { type: "canvas", layer, snapshot }]);
    setRedoStack([]);
  };

  // ---- apply tile updates to the *current layer* ----
  const placeTiles = (updates) => {
    setMaps((prev) => {
      const src = prev[currentLayer];
      let changed = false;
      const nextLayer = src.map((row, ri) =>
        row.map((tile, ci) => {
          const hit = updates.some((u) => u.row === ri && u.col === ci);
          if (!hit) return tile;
          const newVal = isErasing ? null : selectedTile;
          if (newVal !== tile) changed = true;
          return newVal;
        })
      );
      if (!changed) return prev;
      return { ...prev, [currentLayer]: nextLayer };
    });
  };

  // ---- undo / redo ----
  const undo = () => {
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack((p) => p.slice(0, -1));

    if (entry.type === "tilemap") {
      setRedoStack((r) => [
        ...r,
        {
          type: "tilemap",
          layer: entry.layer,
          map: deepCopyGrid(maps[entry.layer]),
        },
      ]);
      setMaps((prev) => ({ ...prev, [entry.layer]: entry.map }));
    } else if (entry.type === "canvas") {
      const canvas = canvasRefs[entry.layer]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const currentSnapshot = canvas.toDataURL();
      setRedoStack((r) => [
        ...r,
        { type: "canvas", layer: entry.layer, snapshot: currentSnapshot },
      ]);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = entry.snapshot;
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((p) => p.slice(0, -1));

    if (entry.type === "tilemap") {
      setUndoStack((u) => [
        ...u,
        {
          type: "tilemap",
          layer: entry.layer,
          map: deepCopyGrid(maps[entry.layer]),
        },
      ]);
      setMaps((prev) => ({ ...prev, [entry.layer]: entry.map }));
    } else if (entry.type === "canvas") {
      const canvas = canvasRefs[entry.layer]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const currentSnapshot = canvas.toDataURL();
      setUndoStack((u) => [
        ...u,
        { type: "canvas", layer: entry.layer, snapshot: currentSnapshot },
      ]);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = entry.snapshot;
    }
  };

  // ---- save / load (tiles only) ----
  const saveMaps = () => {
    const payload = { v: 2, rows, cols, maps };
    localStorage.setItem("savedMapsV2", JSON.stringify(payload));
    alert("Tile layers saved!");
  };

  const loadMaps = () => {
    const raw = localStorage.getItem("savedMapsV2");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.maps && data?.rows && data?.cols) {
      setRowsInput(String(Math.min(200, data.rows)));
      setColsInput(String(Math.min(200, data.cols)));
      setMaps({
        background: data.maps.background || makeGrid(data.rows, data.cols),
        base: data.maps.base || makeGrid(data.rows, data.cols),
        sky: data.maps.sky || makeGrid(data.rows, data.cols),
      });
    }
  };

  // --- UI helpers ---
  const toggleLayerVisibility = (layer) =>
    setLayerVisibility((v) => ({ ...v, [layer]: !v[layer] }));

  const showAllLayers = () =>
    setLayerVisibility({ background: true, base: true, sky: true });

  const hideAllLayers = () =>
    setLayerVisibility({ background: false, base: false, sky: false });

  // readouts
  const stampLabel = `${brushSize}×${brushSize} tiles`;
  const canvasLabel = `${brushSize}× tile-size (~${brushSize * tileSize}px)`; // approximate visual size

  return (
    <div className="w-full h-full flex flex-col">
      {/* HEADER — reordered buttons */}
      <header className="p-4 bg-gray-800 flex justify-between text-white items-center">
        <h2 className="text-xl font-bold">Map Builder</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowToolbar((s) => !s)}
            className="px-3 py-1 bg-gray-600 rounded"
          >
            {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
          </button>

          <button
            onClick={() => setIsErasing((s) => !s)}
            className={`px-3 py-1 ${
              isErasing ? "bg-yellow-600" : "bg-gray-600"
            } rounded`}
            title="Erase tiles (tile brush) or erase paint (canvas brush)"
          >
            {isErasing ? "Erasing" : "Drawing"}
          </button>

          <button onClick={undo} className="px-3 py-1 bg-purple-600 rounded">
            ↩️ Undo
          </button>
          <button onClick={redo} className="px-3 py-1 bg-indigo-600 rounded">
            ↪️ Redo
          </button>

          <button onClick={saveMaps} className="px-3 py-1 bg-green-600 rounded">
            Save
          </button>
          <button onClick={loadMaps} className="px-3 py-1 bg-blue-600 rounded">
            Load
          </button>
          <button onClick={goBack} className="px-3 py-1 bg-red-600 rounded">
            Back
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* TOOLBAR — scrollable column */}
        {showToolbar && (
          <div className="w-64 bg-gray-800 text-white border-r-2 border-gray-600 shadow-md flex flex-col min-h-0">
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Grid Size + Zoom (zoom on the right, +/- stacked) */}
              <div>
                <h3 className="font-bold text-sm mb-2">Grid Size & Zoom</h3>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={rowsInput}
                      onChange={(e) => setRowsInput(e.target.value)}
                      onBlur={updateGridSizes}
                      className="w-16 p-1 text-black rounded"
                      title="Rows"
                    />
                    <span>×</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={colsInput}
                      onChange={(e) => setColsInput(e.target.value)}
                      onBlur={updateGridSizes}
                      className="w-16 p-1 text-black rounded"
                      title="Columns"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setTileSize((s) => Math.min(128, s + 4))}
                      className="px-2 py-1 bg-gray-600 rounded"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setTileSize((s) => Math.max(4, s - 4))}
                      className="px-2 py-1 bg-gray-600 rounded"
                      title="Zoom Out"
                    >
                      −
                    </button>
                    <div className="text-xs text-gray-300 text-center mt-1">
                      {tileSize}px
                    </div>
                  </div>
                </div>
              </div>

              {/* Tile Layer select (below Grid Size/Zoom) */}
              <div>
                <h3 className="font-bold text-sm mb-2">Tile Layer</h3>

                <div className="space-y-2">
                  {["background", "base", "sky"].map((l) => (
                    <div
                      key={l}
                      className="grid grid-cols-3 gap-2 items-stretch"
                    >
                      {/* Layer select button (2/3 width) */}
                      <button
                        onClick={() => setCurrentLayer(l)}
                        className={`col-span-2 px-2 py-1 rounded ${
                          currentLayer === l ? "bg-blue-600" : "bg-gray-600"
                        }`}
                        title={`Select ${l} layer`}
                      >
                        {l}
                      </button>

                      {/* Eye toggle (1/3 width, at least half of layer button) */}
                      <button
                        onClick={() =>
                          setLayerVisibility((v) => ({ ...v, [l]: !v[l] }))
                        }
                        className={`col-span-1 rounded flex items-center justify-center ${
                          layerVisibility[l] ? "bg-gray-600" : "bg-gray-700"
                        }`}
                        title={layerVisibility[l] ? `Hide ${l}` : `Show ${l}`}
                        aria-label={
                          layerVisibility[l] ? `Hide ${l}` : `Show ${l}`
                        }
                      >
                        {layerVisibility[l] ? "👁️" : "🙈"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Show/Hide all below the per-layer toggles */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      setLayerVisibility({
                        background: true,
                        base: true,
                        sky: true,
                      })
                    }
                    className="px-2 py-1 bg-gray-600 rounded"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() =>
                      setLayerVisibility({
                        background: false,
                        base: false,
                        sky: false,
                      })
                    }
                    className="px-2 py-1 bg-gray-600 rounded"
                  >
                    Hide All
                  </button>
                </div>
              </div>

              {/* Tool buttons (below Tile Layer) */}
              <div>
                <h3 className="font-bold text-sm mb-2">Tools</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className={`w-full px-2 py-1 rounded ${
                      toolMode === "tile_brush" ? "bg-blue-600" : "bg-gray-600"
                    }`}
                    onClick={() => setToolMode("tile_brush")}
                  >
                    🧱 Stamp Brush
                  </button>
                  <button
                    className={`w-full px-2 py-1 rounded ${
                      toolMode === "canvas_brush"
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                    onClick={() => setToolMode("canvas_brush")}
                  >
                    🎨 Canvas Brush
                  </button>
                  <button
                    className={`w-full px-2 py-1 rounded ${
                      toolMode === "pan" ? "bg-blue-600" : "bg-gray-600"
                    }`}
                    onClick={() => setToolMode("pan")}
                  >
                    ✋ Pan
                  </button>
                </div>

                {/* Brush Size directly below tool buttons */}
                {(toolMode === "tile_brush" || toolMode === "canvas_brush") && (
                  <div className="mt-3">
                    <h3 className="font-bold text-sm mb-1">Brush Size</h3>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-300 mt-1">
                      {toolMode === "tile_brush"
                        ? `Stamp: ${brushSize}×${brushSize} tiles`
                        : `Canvas: ~${brushSize * tileSize}px`}
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas options: only when Canvas Brush */}
              {toolMode === "canvas_brush" && (
                <div>
                  <h3 className="font-bold text-sm mb-2">Canvas Options</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs mb-1">Color</label>
                      <input
                        type="color"
                        value={canvasColor}
                        onChange={(e) => setCanvasColor(e.target.value)}
                        className="w-full h-8 p-0 border-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0.005"
                        max="1"
                        step="0.005"
                        value={canvasOpacity}
                        onChange={(e) =>
                          setCanvasOpacity(parseFloat(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="text-xs text-gray-300 mt-1">
                        {Math.round(canvasOpacity * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tiles (palette): only when Stamp Brush */}
              {toolMode === "tile_brush" && (
                <div>
                  <h3 className="font-bold text-sm mb-2">Tiles</h3>
                  <Toolbar
                    selectedTile={selectedTile}
                    setSelectedTile={setSelectedTile}
                    toolMode={toolMode}
                    disabled={false}
                  />
                </div>
              )}
            </div>

            {/* Status moved to bottom */}
            <div className="mt-auto p-3 text-xs text-gray-300 border-t border-gray-700">
              <div>
                Mode: <span className="text-white">{toolMode}</span>
              </div>
              <div>
                Layer:{" "}
                <span className="text-white">
                  {currentLayer}
                  {!layerVisibility[currentLayer] ? " (hidden/locked)" : ""}
                </span>
              </div>
              {toolMode === "canvas_brush" && (
                <div>
                  Canvas: {canvasColor} @ {Math.round(canvasOpacity * 100)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANVAS / GRID AREA */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="w-full h-full overflow-auto">
            <div className="min-w-full min-h-full flex justify-center items-start md:items-center p-6">
              <Grid
                // multi-layer tiles
                maps={maps}
                placeTiles={placeTiles}
                // canvas brush
                canvasColor={canvasColor}
                canvasOpacity={canvasOpacity}
                // view / tools
                tileSize={tileSize}
                toolMode={toolMode}
                scrollRef={scrollRef}
                brushSize={brushSize}
                isErasing={isErasing}
                // layers
                canvasRefs={canvasRefs}
                currentLayer={currentLayer}
                layerVisibility={layerVisibility}
                // stroke lifecycle
                onBeginTileStroke={onBeginTileStroke}
                onBeginCanvasStroke={onBeginCanvasStroke}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
