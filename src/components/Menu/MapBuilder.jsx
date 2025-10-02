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
  const rows = Math.max(1, parseInt(rowsInput) || 20);
  const cols = Math.max(1, parseInt(colsInput) || 20);

  // --- per-layer tile maps ---
  const [maps, setMaps] = useState({
    background: makeGrid(rows, cols),
    base: makeGrid(rows, cols),
    sky: makeGrid(rows, cols),
  });

  const [selectedTile, setSelectedTile] = useState("grass");
  const [tileSize, setTileSize] = useState(32);
  const [showToolbar, setShowToolbar] = useState(true);
  const scrollRef = useRef(null);

  // --- tools ---
  const [toolMode, setToolMode] = useState("tile_brush"); // tile_brush | canvas_brush | pan
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

  // NEW: visibility for each layer (tiles + canvas together)
  const [layerVisibility, setLayerVisibility] = useState({
    background: true,
    base: true,
    sky: true,
  });

  // --- undo/redo stacks ---
  // entries:
  // { type:'tilemap', layer:'base'|'background'|'sky', map: Grid }
  // { type:'canvas',  layer:'base'|'background'|'sky', snapshot: dataURL }
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ---- helpers ----
  const resizeLayer = (grid, r, c) =>
    Array.from({ length: r }, (_, ri) =>
      Array.from({ length: c }, (_, ci) => grid[ri]?.[ci] ?? null)
    );

  const updateGridSizes = () => {
    const r = Math.max(1, parseInt(rowsInput) || 20);
    const c = Math.max(1, parseInt(colsInput) || 20);
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
    setRedoStack([]); // new action invalidates redo
  };

  const onBeginCanvasStroke = (layer) => {
    const canvas = canvasRefs[layer]?.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    setUndoStack((prev) => [...prev, { type: "canvas", layer, snapshot }]);
    setRedoStack([]);
  };

  // ---- apply tile updates to the *current layer* only ----
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
      setRowsInput(String(data.rows));
      setColsInput(String(data.cols));
      setMaps({
        background: data.maps.background || makeGrid(data.rows, data.cols),
        base: data.maps.base || makeGrid(data.rows, data.cols),
        sky: data.maps.sky || makeGrid(data.rows, data.cols),
      });
    }
  };

  // --- UI helpers
  const toggleLayerVisibility = (layer) =>
    setLayerVisibility((v) => ({ ...v, [layer]: !v[layer] }));

  const showAllLayers = () =>
    setLayerVisibility({ background: true, base: true, sky: true });

  const hideAllLayers = () =>
    setLayerVisibility({ background: false, base: false, sky: false });

  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between text-white items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Map Builder</h2>
          <span className="italic text-sm text-gray-300">
            Mode: {toolMode} | TileLayer: {currentLayer}
            {!layerVisibility[currentLayer] && " (hidden/locked)"}
            {toolMode === "canvas_brush" && (
              <>
                {" "}
                | Brush: {canvasColor} @ {canvasOpacity}
              </>
            )}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={saveMaps} className="px-3 py-1 bg-green-600 rounded">
            Save
          </button>
          <button onClick={loadMaps} className="px-3 py-1 bg-blue-600 rounded">
            Load
          </button>
          <button onClick={undo} className="px-3 py-1 bg-purple-600 rounded">
            ↩️ Undo
          </button>
          <button onClick={redo} className="px-3 py-1 bg-indigo-600 rounded">
            ↪️ Redo
          </button>
          <button
            onClick={() => setIsErasing((s) => !s)}
            className={`px-3 py-1 ${
              isErasing ? "bg-yellow-600" : "bg-gray-600"
            } rounded`}
            title="Erase tiles (tile brush) or erase paint (canvas brush)"
          >
            {isErasing ? "🧽 Erasing" : "✏️ Drawing"}
          </button>
          <button onClick={goBack} className="px-3 py-1 bg-red-600 rounded">
            Back
          </button>
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="px-3 py-1 bg-gray-600 rounded"
          >
            {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        {showToolbar && (
          <div className="w-64 bg-gray-800 p-4 text-white space-y-6 border-r-2 border-gray-600">
            {/* Grid size */}
            <div>
              <h3 className="font-bold text-sm mb-1">Grid Size</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  value={rowsInput}
                  onChange={(e) => setRowsInput(e.target.value)}
                  onBlur={updateGridSizes}
                  className="w-20 p-1 text-black rounded"
                />
                <span>×</span>
                <input
                  type="number"
                  min="1"
                  value={colsInput}
                  onChange={(e) => setColsInput(e.target.value)}
                  onBlur={updateGridSizes}
                  className="w-20 p-1 text-black rounded"
                />
              </div>
            </div>

            {/* Zoom */}
            <div>
              <h3 className="font-bold text-sm mb-1">Zoom</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTileSize((s) => Math.max(4, s - 4))}
                  className="px-2 py-1 bg-gray-600 rounded"
                >
                  −
                </button>
                <span>{tileSize}px</span>
                <button
                  onClick={() => setTileSize((s) => Math.min(128, s + 4))}
                  className="px-2 py-1 bg-gray-600 rounded"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Zoom is CSS-only; canvas pixels persist.
              </p>
            </div>

            {/* Brush size */}
            <div>
              <h3 className="font-bold text-sm mb-1">Brush Size</h3>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Tools */}
            <div>
              <h3 className="font-bold text-sm mb-1">Tools</h3>
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="font-bold text-sm mb-1">Canvas Color</h3>
                  <input
                    type="color"
                    value={canvasColor}
                    onChange={(e) => setCanvasColor(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Canvas Opacity</h3>
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
                </div>
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
                    toolMode === "canvas_brush" ? "bg-blue-600" : "bg-gray-600"
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
            </div>

            {/* Tile Layer selection */}
            <div>
              <h3 className="font-bold text-sm mb-1">Tile Layer</h3>
              <div className="flex flex-wrap gap-2">
                {LAYERS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setCurrentLayer(l)}
                    className={`px-2 py-1 rounded ${
                      currentLayer === l ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: Layer visibility */}
            <div>
              <h3 className="font-bold text-sm mb-1">Layer Visibility</h3>
              <div className="flex flex-col gap-2">
                {LAYERS.map((l) => (
                  <div
                    key={`vis-${l}`}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{l}</span>
                    <button
                      onClick={() => toggleLayerVisibility(l)}
                      className={`px-2 py-1 rounded ${
                        layerVisibility[l] ? "bg-gray-600" : "bg-gray-700"
                      }`}
                      title={layerVisibility[l] ? "Hide layer" : "Show layer"}
                    >
                      {layerVisibility[l] ? "👁  Hide" : "🙈  Show"}
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={showAllLayers}
                    className="px-2 py-1 bg-gray-600 rounded"
                  >
                    Show All
                  </button>
                  <button
                    onClick={hideAllLayers}
                    className="px-2 py-1 bg-gray-600 rounded"
                  >
                    Hide All
                  </button>
                </div>
              </div>
            </div>

            <Toolbar
              selectedTile={selectedTile}
              setSelectedTile={setSelectedTile}
              toolMode={toolMode}
              disabled={toolMode === "canvas_brush"}
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="w-full h-full overflow-auto">
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
      </main>
    </div>
  );
}
