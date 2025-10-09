import React, { useRef, useState } from "react";
import Grid from "../Map/Grid";

const LAYERS = ["background", "base", "sky"];

// Simple id helper
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Deep copy helpers
const deepCopyGrid = (g) => g.map((row) => [...row]);
const deepCopyObjects = (arr) => arr.map((o) => ({ ...o }));

// Make an empty grid
const makeGrid = (rows, cols, fill = null) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));

export default function MapBuilder({ goBack }) {
  // --- dimensions ---
  const [rowsInput, setRowsInput] = useState("20");
  const [colsInput, setColsInput] = useState("20");
  const rows = Math.max(1, Math.min(200, parseInt(rowsInput) || 20));
  const cols = Math.max(1, Math.min(200, parseInt(colsInput) || 20));

  // --- per-layer tile grids (for color / legacy tiles) ---
  const [maps, setMaps] = useState({
    background: makeGrid(rows, cols),
    base: makeGrid(rows, cols),
    sky: makeGrid(rows, cols),
  });

  // Edit mode: 'draw' | 'select'
  const [interactionMode, setInteractionMode] = useState("draw");

  // Remember user's own grid controls to restore after selection
  const gridDefaultsRef = useRef(null);
  const [hasSelection, setHasSelection] = useState(false);

  // --- per-layer placed OBJECTS (image stamps) ---
  // object: { id, assetId, row, col, wTiles, hTiles, rotation, flipX, flipY, opacity }
  const [objects, setObjects] = useState({
    background: [],
    base: [],
    sky: [],
  });

  // --- canvas refs (per layer) ---
  const canvasRefs = {
    background: useRef(null),
    base: useRef(null),
    sky: useRef(null),
  };

  // --- view / scroll ---
  const [tileSize, setTileSize] = useState(32);
  const [showToolbar, setShowToolbar] = useState(true);
  const scrollRef = useRef(null);

  // --- draw mode + eraser ---
  // Unified flow: choose asset (what), then engine (how)
  const [isErasing, setIsErasing] = useState(false);

  // --- layers ---
  const [currentLayer, setCurrentLayer] = useState("base");
  const [layerVisibility, setLayerVisibility] = useState({
    background: true,
    base: true,
    sky: true,
  });

  // ====== ASSETS (WHAT) ======
  // Asset: { id, name, kind: 'image'|'color', src?, aspectRatio?, defaultEngine, allowedEngines, defaults:{...}, img? }
  const [assets, setAssets] = useState(() => {
    const colorId = uid();
    return [
      {
        id: colorId,
        name: "Solid Color",
        kind: "color",
        defaultEngine: "canvas",
        allowedEngines: ["grid", "canvas"],
        defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.4, snap: false },
        color: "#cccccc",
      },
    ];
  });
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0].id);

  // ====== ENGINE (HOW) ======
  // "grid" (snap to tiles) or "canvas" (free brush)
  const getAsset = (id) => assets.find((a) => a.id === id) || null;
  const selectedAsset = getAsset(selectedAssetId);
  const [engine, setEngine] = useState(
    selectedAsset?.defaultEngine || "canvas"
  );

  // Keep engine in sync when asset changes
  const selectAsset = (id) => {
    const a = getAsset(id);
    setSelectedAssetId(id);
    if (!a) return;
    const prefer = a.defaultEngine || "canvas";
    if (a.allowedEngines?.includes(prefer)) {
      setEngine(prefer);
    } else if (a.allowedEngines?.length) {
      setEngine(a.allowedEngines[0]);
    } else {
      setEngine("canvas");
    }
  };

  // ====== SETTINGS (contextual) ======
  // Grid engine (snap)
  const [gridSettings, setGridSettings] = useState({
    sizeTiles: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true, // engine toggle essentially
  });

  // Canvas engine (free brush)
  const [brushSize, setBrushSize] = useState(2); // in tiles
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27); // fraction of radius
  const [canvasColor, setCanvasColor] = useState("#cccccc"); // used when asset.kind === 'color'
  // Note: smoothing alpha is inside Grid (0.55). We can expose later if you want.

  // --- undo/redo ---
  // entries: { type:'tilemap'|'canvas'|'objects', layer, map? snapshot? objects? }
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ====== size update ======
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

    // objects keep their positions; optional: clip objects that go out of bounds
    setObjects((prev) => {
      const clip = (arr) =>
        arr.filter((o) => o.row >= 0 && o.col >= 0 && o.row < r && o.col < c);
      return {
        background: clip(prev.background),
        base: clip(prev.base),
        sky: clip(prev.sky),
      };
    });
  };

  // ====== stroke lifecycle hooks (for Grid) ======
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

  const onBeginObjectStroke = (layer) => {
    setUndoStack((prev) => [
      ...prev,
      { type: "objects", layer, objects: deepCopyObjects(objects[layer]) },
    ]);
    setRedoStack([]);
  };

  // ====== apply tile updates (grid color) ======
  const placeTiles = (updates, colorHex = canvasColor) => {
    setMaps((prev) => {
      const src = prev[currentLayer];
      let changed = false;
      const nextLayer = src.map((row, ri) =>
        row.map((tile, ci) => {
          const hit = updates.some((u) => u.row === ri && u.col === ci);
          if (!hit) return tile;
          const newVal = isErasing ? null : colorHex;
          if (newVal !== tile) changed = true;
          return newVal;
        })
      );
      if (!changed) return prev;
      return { ...prev, [currentLayer]: nextLayer };
    });
  };

  // Move an object by id
  const moveObject = (layer, id, row, col) => {
    setObjects((prev) => ({
      ...prev,
      [layer]: prev[layer].map((o) => (o.id === id ? { ...o, row, col } : o)),
    }));
  };

  const updateObjectById = (layer, id, patch) => {
    setObjects((prev) => ({
      ...prev,
      [layer]: prev[layer].map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  // Remove an object by id
  const removeObjectById = (layer, id) => {
    setObjects((prev) => ({
      ...prev,
      [layer]: prev[layer].filter((o) => o.id !== id),
    }));
  };

  const snapshotSettings = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        type: "settings",
        settings: {
          gridSettings: { ...gridSettings },
          brushSize,
          canvasOpacity,
          canvasSpacing,
        },
      },
    ]);
    setRedoStack([]);
  };

  // ====== object add/remove ======
  const addObject = (layer, obj) => {
    setObjects((prev) => ({
      ...prev,
      [layer]: [...prev[layer], { ...obj, id: uid() }],
    }));
  };

  const eraseObjectAt = (layer, row, col) => {
    setObjects((prev) => {
      const arr = [...prev[layer]];
      // remove the top-most object whose footprint covers (row,col)
      for (let i = arr.length - 1; i >= 0; i--) {
        const o = arr[i];
        const within =
          row >= o.row &&
          row < o.row + o.wTiles &&
          col >= o.col &&
          col < o.col + o.hTiles;
        if (within) {
          arr.splice(i, 1);
          break;
        }
      }
      return { ...prev, [layer]: arr };
    });
  };

  // ====== undo / redo ======
  const undo = () => {
    if (!undoStack.length) return;
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
    } else if (entry.type === "objects") {
      setRedoStack((r) => [
        ...r,
        {
          type: "objects",
          layer: entry.layer,
          objects: deepCopyObjects(objects[entry.layer]),
        },
      ]);
      setObjects((prev) => ({ ...prev, [entry.layer]: entry.objects }));
    } else if (entry.type === "settings") {
      setRedoStack((r) => [
        ...r,
        {
          type: "settings",
          settings: {
            gridSettings: { ...gridSettings },
            brushSize,
            canvasOpacity,
            canvasSpacing,
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
    }
  };

  const redo = () => {
    if (!redoStack.length) return;
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
    } else if (entry.type === "objects") {
      setUndoStack((u) => [
        ...u,
        {
          type: "objects",
          layer: entry.layer,
          objects: deepCopyObjects(objects[entry.layer]),
        },
      ]);
      setObjects((prev) => ({ ...prev, [entry.layer]: entry.objects }));
    } else if (entry.type === "settings") {
      setUndoStack((u) => [
        ...u,
        {
          type: "settings",
          settings: {
            gridSettings: { ...gridSettings },
            brushSize,
            canvasOpacity,
            canvasSpacing,
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
    }
  };

  // ====== save / load (tiles + objects; canvas pixels not persisted yet) ======
  const saveProject = () => {
    const payload = {
      v: 3,
      rows,
      cols,
      maps,
      objects,
      assets: assets.map(({ img, ...a }) => a), // strip in-memory img
    };
    localStorage.setItem("mapProjectV3", JSON.stringify(payload));
    alert("Project saved (tiles, objects, assets).");
  };

  const loadProject = () => {
    const raw = localStorage.getItem("mapProjectV3");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;
    setRowsInput(String(Math.min(200, data.rows || 20)));
    setColsInput(String(Math.min(200, data.cols || 20)));
    if (data.maps) setMaps(data.maps);
    if (data.objects) setObjects(data.objects);

    if (data.assets) {
      // rehydrate images
      const hydrated = data.assets.map((a) => {
        if (a.kind === "image" && a.src) {
          const img = new Image();
          img.src = a.src;
          return { ...a, img };
        }
        return a;
      });
      setAssets(hydrated);
      if (hydrated[0]) setSelectedAssetId(hydrated[0].id);
    }
  };

  // ====== upload image -> new asset ======
  const handleUpload = (file) => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height || 1;
      const a = {
        id: uid(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        kind: "image",
        src,
        aspectRatio,
        defaultEngine: "grid",
        allowedEngines: ["grid", "canvas"],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
        img,
      };
      setAssets((prev) => [a, ...prev]);
      setSelectedAssetId(a.id);
      setEngine(a.defaultEngine);
    };
    img.src = src;
  };

  const handleSelectionChange = (obj) => {
    if (obj) {
      // We just selected something: remember user's current controls ONCE
      if (!hasSelection) gridDefaultsRef.current = { ...gridSettings };
      setHasSelection(true);

      // Sync controls to the selected object's properties
      setGridSettings((s) => ({
        ...s,
        sizeTiles: Math.max(1, obj.wTiles || 1),
        rotation: obj.rotation || 0,
        flipX: !!obj.flipX,
        flipY: !!obj.flipY,
        opacity: obj.opacity ?? 1,
      }));
    } else {
      // Selection cleared: restore user's controls
      const d = gridDefaultsRef.current;
      if (d) setGridSettings((s) => ({ ...s, ...d }));
      setHasSelection(false);
    }
  };

  // ====== layer visibility toggles ======
  const toggleLayerVisibility = (l) =>
    setLayerVisibility((v) => ({ ...v, [l]: !v[l] }));
  const showAllLayers = () =>
    setLayerVisibility({ background: true, base: true, sky: true });
  const hideAllLayers = () =>
    setLayerVisibility({ background: false, base: false, sky: false });

  // ====== header button order ======
  return (
    <div className="w-full h-full flex flex-col">
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
            title="Erase tiles/objects (grid) or paint erase (canvas)"
          >
            {isErasing ? "Erasing" : "Drawing"}
          </button>
          <button onClick={undo} className="px-3 py-1 bg-purple-600 rounded">
            ↩️ Undo
          </button>
          <button onClick={redo} className="px-3 py-1 bg-indigo-600 rounded">
            ↪️ Redo
          </button>
          <button
            onClick={saveProject}
            className="px-3 py-1 bg-green-600 rounded"
          >
            Save
          </button>
          <button
            onClick={loadProject}
            className="px-3 py-1 bg-blue-600 rounded"
          >
            Load
          </button>
          <button onClick={goBack} className="px-3 py-1 bg-red-600 rounded">
            Back
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* TOOLBAR */}
        {showToolbar && (
          <div className="w-72 bg-gray-800 text-white border-r-2 border-gray-600 flex flex-col min-h-0">
            <div className="p-4 space-y-5 overflow-y-auto">
              {/* ASSETS (WHAT) */}
              <div>
                <h3 className="font-bold text-sm mb-2">Assets</h3>
                <div className="flex gap-2 mb-2">
                  <label className="px-2 py-1 bg-gray-700 rounded cursor-pointer">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        snapshotSettings(); // ← add this
                        handleUpload(e.target.files?.[0]);
                      }}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => selectAsset(a.id)}
                      className={`border rounded p-1 text-xs ${
                        selectedAssetId === a.id
                          ? "border-blue-400 bg-blue-600/20"
                          : "border-gray-600 bg-gray-700/40"
                      }`}
                      title={a.name}
                    >
                      {a.kind === "image" ? (
                        <img
                          src={a.src}
                          alt={a.name}
                          className="w-full h-12 object-contain"
                        />
                      ) : (
                        <div
                          className="w-full h-12 rounded"
                          style={{ backgroundColor: a.color }}
                        />
                      )}
                      <div className="mt-1 truncate">{a.name}</div>
                    </button>
                  ))}
                </div>
                {/* Color picker for the color asset */}
                {selectedAsset?.kind === "color" && (
                  <div className="mt-2">
                    <label className="block text-xs mb-1">Color</label>
                    <input
                      type="color"
                      value={canvasColor}
                      onChange={(e) => {
                        snapshotSettings(); // ← add this
                        setCanvasColor(e.target.value);
                      }}
                      className="w-full h-8 p-0 border-0"
                    />
                  </div>
                )}
              </div>

              {/* ENGINE (HOW) */}
              <div>
                {/* Mode */}
                <div>
                  <h3 className="font-bold text-sm mb-2">Mode</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`px-2 py-1 rounded ${
                        interactionMode === "select"
                          ? "bg-blue-600"
                          : "bg-gray-600"
                      }`}
                      onClick={() => setInteractionMode("select")}
                      title="Select / move existing objects (no stamping)"
                    >
                      🖱️ Select
                    </button>
                    <button
                      className={`px-2 py-1 rounded ${
                        interactionMode === "draw"
                          ? "bg-blue-600"
                          : "bg-gray-600"
                      }`}
                      onClick={() => setInteractionMode("draw")}
                      title="Stamp / paint (normal drawing)"
                    >
                      ✏️ Draw
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Pan: hold <kbd>Space</kbd> or use middle-mouse
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!selectedAsset?.allowedEngines?.includes("grid")}
                    onClick={() => setEngine("grid")}
                    className={`px-2 py-1 rounded ${
                      engine === "grid" ? "bg-blue-600" : "bg-gray-600"
                    } disabled:opacity-40`}
                  >
                    Snap (Grid)
                  </button>
                  <button
                    disabled={
                      !selectedAsset?.allowedEngines?.includes("canvas")
                    }
                    onClick={() => setEngine("canvas")}
                    className={`px-2 py-1 rounded ${
                      engine === "canvas" ? "bg-blue-600" : "bg-gray-600"
                    } disabled:opacity-40`}
                  >
                    Free (Canvas)
                  </button>
                </div>
              </div>

              {/* GRID SIZE + ZOOM */}
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

              {/* LAYERS */}
              <div>
                <h3 className="font-bold text-sm mb-2">Tile Layer</h3>
                <div className="space-y-2">
                  {LAYERS.map((l, i) => (
                    <div
                      key={l}
                      className="grid grid-cols-3 gap-2 items-stretch"
                    >
                      <button
                        onClick={() => setCurrentLayer(l)}
                        className={`col-span-2 px-2 py-1 rounded ${
                          currentLayer === l ? "bg-blue-600" : "bg-gray-600"
                        }`}
                      >
                        {l}
                      </button>
                      <button
                        onClick={() => toggleLayerVisibility(l)}
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
                  <div className="flex gap-2 mt-2">
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

              {/* CONTROLS (contextual) */}
              {engine === "grid" && (
                <div>
                  <h3 className="font-bold text-sm mb-2">Grid Stamp</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs mb-1">
                        Size (tiles wide)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={gridSettings.sizeTiles}
                        onChange={(e) => {
                          snapshotSettings();
                          setGridSettings((s) => ({
                            ...s,
                            sizeTiles: Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            ),
                          }));
                        }}
                        className="w-full p-1 text-black rounded"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs mb-1">Rotate</label>
                        <input
                          type="number"
                          value={gridSettings.rotation}
                          onChange={(e) => {
                            snapshotSettings();
                            setGridSettings((s) => ({
                              ...s,
                              rotation: parseInt(e.target.value) || 0,
                            }));
                          }}
                          className="w-full p-1 text-black rounded"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="text-xs mb-1">Flip</label>
                        <div className="flex gap-2">
                          <label className="text-xs">
                            <input
                              type="checkbox"
                              checked={gridSettings.flipX}
                              onChange={(e) => {
                                snapshotSettings();
                                setGridSettings((s) => ({
                                  ...s,
                                  flipX: e.target.checked,
                                }));
                              }}
                            />{" "}
                            X
                          </label>
                          <label className="text-xs">
                            <input
                              type="checkbox"
                              checked={gridSettings.flipY}
                              onChange={(e) => {
                                snapshotSettings();
                                setGridSettings((s) => ({
                                  ...s,
                                  flipY: e.target.checked,
                                }));
                              }}
                            />{" "}
                            Y
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Opacity</label>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={gridSettings.opacity}
                          onChange={(e) => {
                            snapshotSettings();
                            setGridSettings((s) => ({
                              ...s,
                              opacity: parseFloat(e.target.value),
                            }));
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {engine === "canvas" && (
                <div>
                  <h3 className="font-bold text-sm mb-2">Canvas Brush</h3>

                  {/* Brush Size */}
                  <div className="mt-1">
                    <label className="block text-xs mb-1">
                      Brush Size (tiles)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={brushSize}
                      onChange={(e) => {
                        snapshotSettings();
                        setBrushSize(parseInt(e.target.value));
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-300 mt-1">
                      ~{brushSize * tileSize}px
                    </div>
                  </div>

                  {/* Opacity / spacing */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={canvasOpacity}
                        onChange={(e) => {
                          snapshotSettings();
                          setCanvasOpacity(parseFloat(e.target.value));
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1">Spacing</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.6"
                        step="0.01"
                        value={canvasSpacing}
                        onChange={(e) => {
                          snapshotSettings();
                          setCanvasSpacing(parseFloat(e.target.value));
                        }}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-300 mt-1">
                        {Math.round(canvasSpacing * 100)}% radius
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status at bottom */}
            <div className="mt-auto p-3 text-xs text-gray-300 border-t border-gray-700">
              <div>
                Asset: <span className="text-white">{selectedAsset?.name}</span>
              </div>
              <div>
                Engine: <span className="text-white">{engine}</span>
              </div>
              <div>
                Layer:{" "}
                <span className="text-white">
                  {currentLayer}
                  {!layerVisibility[currentLayer] ? " (hidden/locked)" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CENTERED DRAW AREA */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="w-full h-full overflow-auto">
            <div className="min-w-full min-h-full flex justify-center items-start md:items-center p-6">
              <Grid
                // data
                maps={maps}
                objects={objects}
                assets={assets}
                // drawing config
                engine={engine}
                selectedAsset={selectedAsset}
                gridSettings={gridSettings}
                brushSize={brushSize}
                canvasOpacity={canvasOpacity}
                canvasColor={canvasColor}
                canvasSpacing={canvasSpacing}
                isErasing={isErasing}
                interactionMode={interactionMode}
                // view / layers
                tileSize={tileSize}
                scrollRef={scrollRef}
                canvasRefs={canvasRefs}
                currentLayer={currentLayer}
                layerVisibility={layerVisibility}
                // stroke lifecycle
                onBeginTileStroke={onBeginTileStroke}
                onBeginCanvasStroke={onBeginCanvasStroke}
                onBeginObjectStroke={onBeginObjectStroke}
                // mutators
                placeTiles={placeTiles}
                addObject={addObject}
                eraseObjectAt={eraseObjectAt}
                moveObject={moveObject}
                removeObjectById={removeObjectById}
                updateObjectById={updateObjectById}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
