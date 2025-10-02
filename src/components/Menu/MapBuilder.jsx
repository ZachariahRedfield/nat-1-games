import React, { useRef, useState } from "react";
import Grid from "../Map/Grid";
import Toolbar from "../Map/Toolbar";

export default function MapBuilder({ goBack }) {
  const [selectedTile, setSelectedTile] = useState("grass");
  const [rowsInput, setRowsInput] = useState("20");
  const [colsInput, setColsInput] = useState("20");
  const [map, setMap] = useState(
    Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => null))
  );
  const [tileSize, setTileSize] = useState(32);
  const [showToolbar, setShowToolbar] = useState(true);
  const scrollRef = useRef(null);

  const [toolMode, setToolMode] = useState("tile_brush");
  const [brushSize, setBrushSize] = useState(1);
  const [canvasColor, setCanvasColor] = useState("#cccccc");
  const [canvasOpacity, setCanvasOpacity] = useState(0.4);
  const [isErasing, setIsErasing] = useState(false);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null); // for undoing canvas

  const parseIntOrDefault = (val, def) => {
    const n = parseInt(val);
    return isNaN(n) ? def : Math.max(1, n);
  };

  const updateGrid = () => {
    const rows = parseIntOrDefault(rowsInput, 20);
    const cols = parseIntOrDefault(colsInput, 20);
    const newMap = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => map[r]?.[c] || null)
    );
    setMap(newMap);
  };

  const placeTiles = (updates) => {
    setHistory((prev) => [
      ...prev,
      { type: "map", map: map.map((r) => [...r]) },
    ]);
    setMap((prevMap) =>
      prevMap.map((row, ri) =>
        row.map((tile, ci) => {
          const match = updates.find((u) => u.row === ri && u.col === ci);
          return match ? (isErasing ? null : selectedTile) : tile;
        })
      )
    );
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (last.type === "map") {
      setMap(last.map);
    } else if (last.type === "canvas" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = last.snapshot;
    }
  };

  const saveMap = () => {
    const json = JSON.stringify(map);
    localStorage.setItem("savedMap", json);
    alert("Map saved!");
  };

  const loadMap = () => {
    const saved = localStorage.getItem("savedMap");
    if (saved) {
      const loadedMap = JSON.parse(saved);
      setRowsInput(String(loadedMap.length));
      setColsInput(String(loadedMap[0]?.length || "1"));
      setMap(loadedMap);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between text-white items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Map Builder</h2>
          <span className="italic text-sm text-gray-300">
            Mode: {toolMode}
            {toolMode === "canvas_brush" && (
              <>
                {" "}
                | Color: {canvasColor} | Opacity: {canvasOpacity}
              </>
            )}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={undo} className="px-3 py-1 bg-purple-600 rounded">
            ↩️ Undo
          </button>
          <button
            onClick={() => setIsErasing((prev) => !prev)}
            className={`px-3 py-1 ${
              isErasing ? "bg-yellow-600" : "bg-gray-600"
            } rounded`}
          >
            {isErasing ? "🧽 Erasing" : "✏️ Drawing"}
          </button>
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="px-3 py-1 bg-gray-600 rounded"
          >
            {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
          </button>
          <button onClick={saveMap} className="px-3 py-1 bg-green-600 rounded">
            Save
          </button>
          <button onClick={loadMap} className="px-3 py-1 bg-blue-600 rounded">
            Load
          </button>
          <button onClick={goBack} className="px-3 py-1 bg-red-600 rounded">
            Back
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        {showToolbar && (
          <div className="w-64 bg-gray-800 p-4 text-white space-y-6 border-r-2 border-gray-600 shadow-md">
            {/* Tool controls */}
            <div>
              <h3 className="font-bold text-sm mb-1">Grid Size</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  value={rowsInput}
                  onChange={(e) => setRowsInput(e.target.value)}
                  onBlur={updateGrid}
                  className="w-20 p-1 text-black rounded"
                  placeholder="Rows"
                />
                <span>×</span>
                <input
                  type="number"
                  min="1"
                  value={colsInput}
                  onChange={(e) => setColsInput(e.target.value)}
                  onBlur={updateGrid}
                  className="w-20 p-1 text-black rounded"
                  placeholder="Cols"
                />
              </div>
            </div>

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
            </div>

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

            <div>
              <h3 className="font-bold text-sm mb-1">Tool Mode</h3>
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
              map={map}
              placeTiles={placeTiles}
              canvasColor={canvasColor}
              canvasOpacity={canvasOpacity}
              tileSize={tileSize}
              toolMode={toolMode}
              scrollRef={scrollRef}
              brushSize={brushSize}
              isErasing={isErasing}
              onCanvasChange={(snapshot) => {
                setHistory((prev) => [...prev, { type: "canvas", snapshot }]);
              }}
              canvasRef={canvasRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
