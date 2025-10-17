import MapStatus from "./MapStatus";
import React, { useRef, useState } from "react";
import Grid from "../../Map/Grid/Grid";

import { LAYERS, uid, deepCopyGrid, deepCopyObjects, makeGrid } from "./utils";
import CanvasBrushControls from "./CanvasBrushControls";

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
  const [selectedObj, setSelectedObj] = useState(null);

  // --- per-layer placed OBJECTS (image stamps) ---
  // object: { id, assetId, row, col, wTiles, hTiles, rotation, flipX, flipY, opacity }
  const [objects, setObjects] = useState({
    background: [],
    base: [],
    sky: [],
  });

  // --- tokens (characters / interactables) ---
  // token: { id, assetId, row, col, wTiles, hTiles, rotation, opacity, meta?:{ name, hp, initiative } }
  const [tokens, setTokens] = useState([]);
  const [tokensVisible, setTokensVisible] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenHUDVisible, setTokenHUDVisible] = useState(true);

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
        name: "Light Grey",
        kind: "color",
        defaultEngine: "canvas",
        allowedEngines: ["grid", "canvas"],
        defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.4, snap: false },
        color: "#cccccc",
      },
    ];
  });
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0].id);
  const [assetGroup, setAssetGroup] = useState("image"); // 'image' | 'token' | 'material'
  const [showAssetKindMenu, setShowAssetKindMenu] = useState(false);

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
    if (a.kind === "token") {
      // Hide drawing engines for tokens; rely on click-to-place behavior
      setInteractionMode("select");
      setEngine("grid");
    } else if (a.allowedEngines?.includes(prefer)) {
      setEngine(prefer);
    } else if (a.allowedEngines?.length) {
      setEngine(a.allowedEngines[0]);
    } else {
      setEngine("canvas");
    }
    // If picking a color asset, sync canvasColor so paint uses it
    if (a.kind === "color" && a.color) setCanvasColor(a.color);
  };

  // When asset group changes, auto-select a matching asset and force Grid engine for Token group
  React.useEffect(() => {
    const ensureSelection = (kind) => {
      if (selectedAsset?.kind !== kind) {
        const next = assets.find((x) => x.kind === kind);
        if (next) setSelectedAssetId(next.id);
      }
    };
    if (assetGroup === "image") ensureSelection("image");
    else if (assetGroup === "material") ensureSelection("color");
    else if (assetGroup === "token") {
      ensureSelection("token");
      setEngine("grid");
    }
  }, [assetGroup, assets]);

  // ====== SETTINGS (contextual) ======
  // Grid engine (snap)
  const [gridSettings, setGridSettings] = useState({
    sizeTiles: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true, // engine toggle essentially
    smartAdjacency: true, // neighbor-aware alignment for grid stamps
  });

  // Canvas engine (free brush)
  const [brushSize, setBrushSize] = useState(2); // in tiles
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27); // fraction of radius
  const [canvasColor, setCanvasColor] = useState("#cccccc"); // used when asset.kind === 'color'
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(0.55); // EMA smoothing factor (0..1)
  const [showAssetPreviews, setShowAssetPreviews] = useState(true);
  const [showAddColor, setShowAddColor] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [addColorMode, setAddColorMode] = useState('palette');
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#66ccff");
  // Text/Label creation state
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#ffffff");
  const [newLabelSize, setNewLabelSize] = useState(28);
  const [newLabelFont, setNewLabelFont] = useState("Arial");
  const [flowHue, setFlowHue] = useState(200);
  const [flowSat, setFlowSat] = useState(70);
  const [flowLight, setFlowLight] = useState(55);
  // Clear token selection when leaving Token assets menu
  React.useEffect(() => {
    if (assetGroup !== 'token' && selectedToken) setSelectedToken(null);
  }, [assetGroup]);
  // Keyboard: 'V' toggles interaction (Draw/Select)
  React.useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs/textareas/contentEditable
      const t = e.target;
      const tag = (t && t.tagName) ? t.tagName.toUpperCase() : '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable);
      if (isTyping) return;
      if (e.code === 'KeyV') {
        setInteractionMode((m) => (m === 'select' ? 'draw' : 'select'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Note: canvasSmoothing now exposed via CanvasBrushControls and used in Grid EMA.

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

  const onBeginTokenStroke = () => {
    setUndoStack((prev) => [
      ...prev,
      { type: "tokens", tokens: deepCopyObjects(tokens) },
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

  // ====== tokens API ======
  const addToken = (tok) => {
    setTokens((prev) => [...prev, { ...tok, id: uid() }]);
  };
  const moveToken = (id, row, col) => {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, row, col } : t)));
  };
  const updateTokenById = (id, patch) => {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTokenById = (id) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
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
          canvasBlendMode,
          canvasSmoothing,
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
    } else if (entry.type === "tokens") {
      setRedoStack((r) => [
        ...r,
        { type: "tokens", tokens: deepCopyObjects(tokens) },
      ]);
      setTokens(entry.tokens || []);
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
            canvasBlendMode,
            canvasSmoothing,
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
      if (entry.settings.canvasBlendMode)
        setCanvasBlendMode(entry.settings.canvasBlendMode);
      if (typeof entry.settings.canvasSmoothing === 'number')
        setCanvasSmoothing(entry.settings.canvasSmoothing);
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
    } else if (entry.type === "tokens") {
      setUndoStack((u) => [
        ...u,
        { type: "tokens", tokens: deepCopyObjects(tokens) },
      ]);
      setTokens(entry.tokens || []);
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
            canvasBlendMode,
            canvasSmoothing,
          },
        },
      ]);
      setGridSettings(entry.settings.gridSettings);
      setBrushSize(entry.settings.brushSize);
      setCanvasOpacity(entry.settings.canvasOpacity);
      setCanvasSpacing(entry.settings.canvasSpacing);
      if (entry.settings.canvasBlendMode)
        setCanvasBlendMode(entry.settings.canvasBlendMode);
      if (typeof entry.settings.canvasSmoothing === 'number')
        setCanvasSmoothing(entry.settings.canvasSmoothing);
    }
  };

  // ====== save / load (tiles + objects; canvas pixels not persisted yet) ======
  const saveProject = () => {
    // Capture per-layer canvas buffers as PNG data URLs
    const canvases = {};
    for (const layer of LAYERS) {
      const c = canvasRefs[layer]?.current;
      canvases[layer] = c ? c.toDataURL("image/png") : null;
    }

    const payload = {
      v: 4,
      rows,
      cols,
      maps,
      objects,
      tokens,
      canvases,
      assets: assets.map(({ img, ...a }) => a), // strip in-memory img
    };
    localStorage.setItem("mapProjectV4", JSON.stringify(payload));
    alert("Project saved (tiles, objects, canvases, assets).");
  };

  const loadProject = () => {
    // Prefer V4 with canvas data, fall back to V3
    const rawV4 = localStorage.getItem("mapProjectV4");
    const rawV3 = localStorage.getItem("mapProjectV3");
    const raw = rawV4 || rawV3;
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;
    setRowsInput(String(Math.min(200, data.rows || 20)));
    setColsInput(String(Math.min(200, data.cols || 20)));
    if (data.maps) setMaps(data.maps);
    if (data.objects) setObjects(data.objects);
    if (data.tokens) setTokens(data.tokens);

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

    // Restore per-layer canvases if present (V4+)
    if (data.canvases) {
      // Wait a tick to ensure canvases are mounted with correct size
      setTimeout(() => {
        for (const layer of LAYERS) {
          const dataUrl = data.canvases[layer];
          if (!dataUrl) continue;
          const canvas = canvasRefs[layer]?.current;
          if (!canvas) continue;
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = dataUrl;
        }
      }, 0);
    }
  };

  // ====== upload image -> new asset ======
  const handleUpload = (file) => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height || 1;
      const defaultName = file.name.replace(/\.[^/.]+$/, "");
      const name = window.prompt("Name this asset", defaultName) || defaultName;
      const a = {
        id: uid(),
        name,
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

  // ====== create Text/Label -> new image asset ======
  const createTextLabelAsset = () => {
    const text = (newLabelText || "Label").trim();
    const size = Math.max(8, Math.min(128, parseInt(newLabelSize) || 28));
    const color = newLabelColor || "#ffffff";
    const font = newLabelFont || "Arial";
    const padding = Math.round(size * 0.35);

    // measure
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    mctx.font = `${size}px ${font}`;
    const metrics = mctx.measureText(text);
    const textW = Math.ceil(metrics.width);
    const textH = Math.ceil(size * 1.2);
    const w = Math.max(1, textW + padding * 2);
    const h = Math.max(1, textH + padding * 2);

    // draw
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${size}px ${font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    // subtle dark outline for legibility
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
    ctx.fillText(text, padding, padding);

    const src = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height || 1;
      const a = {
        id: uid(),
        name: text,
        kind: 'image', // treat labels like images for now
        src,
        aspectRatio,
        defaultEngine: 'grid',
        allowedEngines: ['grid','canvas'],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
        img,
      };
      setAssets((prev) => [a, ...prev]);
      setSelectedAssetId(a.id);
      setEngine(a.defaultEngine);
      setShowAddText(false);
      setNewLabelText("");
    };
    img.src = src;
  };

  const handleSelectionChange = (obj) => {
    if (obj) {
      // We just selected something: remember user's current controls ONCE
      if (!hasSelection) gridDefaultsRef.current = { ...gridSettings };
      setHasSelection(true);
      setSelectedObj(obj);

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
      setSelectedObj(null);
    }
  };

  const handleTokenSelectionChange = (tok) => {
    if (tok) {
      setSelectedToken(tok);
      setGridSettings((s) => ({
        ...s,
        sizeTiles: Math.max(1, tok.wTiles || 1),
        rotation: tok.rotation || 0,
        flipX: false,
        flipY: false,
        opacity: tok.opacity ?? 1,
      }));
    } else {
      setSelectedToken(null);
    }
  };

  // ====== Save current selection as a new image asset ======
  const saveSelectionAsAsset = async () => {
    const obj = selectedObj;
    if (!obj) return;
    const asset = assets.find((a) => a.id === obj.assetId);
    if (!asset || asset.kind !== "image") return;
    const baseImg = asset.img || (() => { const im = new Image(); im.src = asset.src; return im; })();
    const wPx = Math.max(1, Math.round(obj.wTiles * tileSize));
    const hPx = Math.max(1, Math.round(obj.hTiles * tileSize));
    const canvas = document.createElement('canvas');
    canvas.width = wPx; canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(wPx / 2, hPx / 2);
    const rot = ((obj.rotation || 0) * Math.PI) / 180;
    ctx.rotate(rot);
    ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
    ctx.globalAlpha = obj.opacity ?? 1;
    ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/png');
    const nameDefault = `${asset.name}-variant`;
    const name = window.prompt('Name this saved asset', nameDefault) || nameDefault;
    const newImg = new Image();
    newImg.src = dataUrl;
    const newAsset = {
      id: uid(),
      name,
      kind: 'image',
      src: dataUrl,
      aspectRatio: wPx / hPx || 1,
      defaultEngine: 'grid',
      allowedEngines: ['grid', 'canvas'],
      defaults: { sizeTiles: obj.wTiles || 1, opacity: obj.opacity ?? 1, snap: true },
      img: newImg,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setEngine('grid');
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
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
            <button onClick={() => setShowToolbar((s) => !s)} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">
              {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
            </button>
            <button onClick={() => setIsErasing((s) => !s)} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded" title="Erase tiles/objects (grid) or paint erase (canvas)">
              {isErasing ? "Erasing" : "Drawing"}
            </button>
          </div>
          <div className="flex gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
            <button onClick={undo} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">Undo</button>
            <button onClick={redo} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">Redo</button>
          
          <button onClick={saveSelectionAsAsset} disabled={!selectedObj} className={`px-2.5 py-1 text-sm border rounded ${selectedObj ? 'bg-amber-600 border-amber-500 hover:bg-amber-500' : 'bg-gray-700 border-gray-500 cursor-not-allowed'}`} title="Save selected image (with edits) as a new asset">Save Selection</button>
        </div>
          <div className="flex gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
            <button onClick={saveProject} className="px-2.5 py-1 text-sm bg-green-700 hover:bg-green-600 border border-green-500 rounded">Save</button>
            <button onClick={loadProject} className="px-2.5 py-1 text-sm bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded">Load</button>
            <button onClick={goBack} className="px-2.5 py-1 text-sm bg-red-700 hover:bg-red-600 border border-red-500 rounded">Back</button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* TOOLBAR */}
        {showToolbar && (
          <div className="w-72 bg-gray-800 text-white border-r-2 border-gray-600 flex flex-col min-h-0">
            <div className="p-4 space-y-5 overflow-y-auto">
              {/* ASSETS (WHAT) */}
              <div className="relative">
                <button
                  className="font-bold text-sm mb-2 px-2 py-1 bg-gray-700 rounded inline-flex items-center gap-2"
                  onClick={() => setShowAssetKindMenu((s)=>!s)}
                >
                  Assets
                  <span className="text-xs opacity-80">{assetGroup === 'image' ? 'Image' : assetGroup === 'token' ? 'Token' : 'Materials'}</span>
                </button>
                {showAssetKindMenu && (
                  <div
                    className="absolute z-50 mt-1 p-2 bg-gray-800 border border-gray-700 rounded grid grid-cols-2 gap-2"
                    onMouseLeave={() => setShowAssetKindMenu(false)}
                  >
                    <button className={`px-2 py-1 rounded ${assetGroup==='image'?'bg-blue-600':'bg-gray-700'}`} onClick={()=>setAssetGroup('image')}>Image</button>
                    <button className={`px-2 py-1 rounded ${assetGroup==='token'?'bg-blue-600':'bg-gray-700'}`} onClick={()=>setAssetGroup('token')}>Token</button>
                    <button className={`col-span-2 px-2 py-1 rounded ${assetGroup==='material'?'bg-blue-600':'bg-gray-700'}`} onClick={()=>setAssetGroup('material')}>Materials</button>
                    <div className="col-span-2 text-[10px] text-gray-300">Materials currently includes Color assets.</div>
                  </div>
                )}
                <div className="flex gap-2 mb-2 items-center">
                  {assetGroup === 'image' && (
                    <label className="px-2 py-1 bg-gray-700 rounded cursor-pointer text-sm" title="Upload">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          snapshotSettings();
                          handleUpload(e.target.files?.[0]);
                        }}
                      />
                    </label>
                  )}
                  {assetGroup === 'image' && (
                    <button className="px-2 py-1 bg-gray-700 rounded text-sm" onClick={() => setShowAddText((s)=>!s)}>
                      {showAddText ? 'Close' : 'Add Text/Label'}
                    </button>
                  )}
                  {assetGroup === 'material' && (
                    <button className="px-2 py-1 bg-gray-700 rounded text-sm" onClick={() => setShowAddColor((s) => !s)}>
                      {showAddColor ? "Close" : "Add Color"}
                    </button>
                  )}
                  {assetGroup === 'token' && (
                    <button className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded text-sm" onClick={() => setShowAddToken((s)=>!s)}>
                      {showAddToken ? 'Close' : 'Add Token'}
                    </button>
                  )}
                </div>
                <div className="mb-2">
                  <button className="w-full text-left px-2 py-1 bg-gray-700 rounded text-sm" onClick={() => setShowAssetPreviews((s) => !s)}>
                    {showAssetPreviews ? "Hide Previews" : "Show Previews"}
                  </button>
                </div>
                {(assetGroup === 'image' || assetGroup === 'token') && selectedAsset && (
                  <div className="mb-2">
                    <button
                      className="w-full text-left px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
                      onClick={() => {
                        const a = selectedAsset;
                        if (!a) return;
                        if (a.kind === 'token') {
                          const useCount = (tokens || []).filter(t => t.assetId === a.id).length;
                          if (useCount > 0) {
                            alert(`Cannot delete token asset in use by ${useCount} token(s). Delete tokens first.`);
                            return;
                          }
                        } else if (a.kind === 'image') {
                          const countInObjects = ['background','base','sky'].reduce((acc, l) => acc + (objects?.[l]||[]).filter(o => o.assetId === a.id).length, 0);
                          if (countInObjects > 0) {
                            alert(`Cannot delete image asset in use by ${countInObjects} object(s). Delete stamps first.`);
                            return;
                          }
                        }
                        if (confirm(`Delete asset "${a.name}"?`)) {
                          setAssets(prev => prev.filter(x => x.id !== a.id));
                          // Select another asset in the same group if possible
                          const next = assets.find(x => x.id !== a.id && (assetGroup==='image' ? x.kind==='image' : assetGroup==='token' ? x.kind==='token' : true));
                          if (next) setSelectedAssetId(next.id);
                        }
                      }}
                    >
                      Delete Asset
                    </button>
                  </div>
                )}
                {assetGroup === 'token' && showAddToken && (
                  <div className="mb-3 p-2 border border-gray-600 rounded space-y-2">
                    <div className="text-xs text-gray-300">Create Token Asset</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs col-span-2">Name
                        <input type="text" className="w-full p-1 text-black rounded" id="newTokenNameInput" placeholder="Token name" />
                      </label>
                      <label className="text-xs">Glow Color
                        <input type="color" id="newTokenGlowInput" defaultValue="#7dd3fc" className="w-full h-8 p-0 border border-gray-500 rounded" />
                      </label>
                      <label className="text-xs">Upload Image
                        <input type="file" id="newTokenFileInput" accept="image/*" className="w-full text-xs" />
                      </label>
                    </div>
                    <div className="text-[10px] text-gray-300">Tip: If you don't upload, the currently selected image (if any) will be used.</div>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded text-sm"
                        onClick={() => {
                          const nameEl = document.getElementById('newTokenNameInput');
                          const glowEl = document.getElementById('newTokenGlowInput');
                          const fileEl = document.getElementById('newTokenFileInput');
                          const name = (nameEl?.value || 'Token').trim();
                          const glow = glowEl?.value || '#7dd3fc';
                          const file = fileEl?.files?.[0];

                          const makeWithSrc = (src, imgW=1, imgH=1) => {
                            const aspectRatio = (imgW && imgH) ? (imgW / imgH) : 1;
                            const a = {
                              id: uid(),
                              name,
                              kind: 'token',
                              src,
                              aspectRatio,
                              defaultEngine: 'grid',
                              allowedEngines: [],
                              defaults: { sizeTiles: 1, opacity: 1, snap: true },
                            };
                            setAssets(prev => [a, ...prev]);
                            setSelectedAssetId(a.id);
                            setShowAddToken(false);
                          };

                          if (file) {
                            const src = URL.createObjectURL(file);
                            const img = new Image();
                            img.onload = () => makeWithSrc(src, img.width, img.height);
                            img.src = src;
                          } else if (selectedAsset && selectedAsset.kind === 'image') {
                            makeWithSrc(selectedAsset.src, (selectedAsset.img?.width)||1, (selectedAsset.img?.height)||1);
                          } else {
                            alert('Please upload an image or select an Image asset first.');
                          }
                        }}
                      >
                        Create Token
                      </button>
                    </div>
                  </div>
                )}
                {assetGroup === 'image' && showAddText && (
                  <div className="mb-3 p-2 border border-gray-600 rounded space-y-2">
                    <div className="text-xs text-gray-300">Create Text/Label Asset</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs col-span-2">Text
                        <input type="text" className="w-full p-1 text-black rounded" value={newLabelText} onChange={(e)=>setNewLabelText(e.target.value)} placeholder="Label text" />
                      </label>
                      <label className="text-xs">Color
                        <input type="color" className="w-full h-8 p-0 border border-gray-500 rounded" value={newLabelColor} onChange={(e)=>setNewLabelColor(e.target.value)} />
                      </label>
                      <label className="text-xs">Font Size
                        <input type="number" min="8" max="128" className="w-full p-1 text-black rounded" value={newLabelSize} onChange={(e)=>setNewLabelSize(parseInt(e.target.value)||28)} />
                      </label>
                      <label className="text-xs col-span-2">Font Family
                        <input type="text" className="w-full p-1 text-black rounded" value={newLabelFont} onChange={(e)=>setNewLabelFont(e.target.value)} placeholder="Arial" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={createTextLabelAsset}>Create Label</button>
                    </div>
                  </div>
                )}
                {assetGroup === 'material' && showAddColor && (
                  <div className="mb-3 p-2 border border-gray-600 rounded">
                    <div className="text-xs text-gray-300 mb-2">Create Color Asset</div>
                    <div className="flex gap-2 mb-2 text-xs">
                      <button className={`px-2 py-1 rounded ${addColorMode === 'palette' ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setAddColorMode('palette')}>Palette</button>
                      <button className={`px-2 py-1 rounded ${addColorMode === 'flow' ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setAddColorMode('flow')}>Flow</button>
                      <button className={`px-2 py-1 rounded ${addColorMode === 'hex' ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setAddColorMode('hex')}>Hex Grid</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {addColorMode === 'palette' && (
                      <div>
                        <div className="text-xs mb-1">Palette</div>
                        <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-full h-8 p-0 border-0" />
                        <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="Name (optional)" className="mt-2 w-full p-1 text-black rounded" />
                        <button
                          className="mt-2 px-2 py-1 bg-blue-600 rounded"
                          onClick={() => {
                            const name = newColorName || "Custom Color";
                            const a = {
                              id: uid(),
                              name,
                              kind: "color",
                              color: newColorHex,
                              defaultEngine: "canvas",
                              allowedEngines: ["grid", "canvas"],
                              defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.6, snap: false },
                            };
                            setAssets((prev) => [a, ...prev]);
                            setSelectedAssetId(a.id);
                            setEngine(a.defaultEngine);
                            setCanvasColor(a.color);
                            setShowAddColor(false);
                            setNewColorName("");
                          }}
                        >
                          Add Color
                        </button>
                      </div>
                      )}
                      {addColorMode === 'hex' && (
                      <div>
                        <div className="text-xs mb-1">Hex Grid</div>
                        <div className="grid grid-cols-8 gap-2 p-2">
                          {[
                            '#ff0000','#ff4000','#ff8000','#ffbf00','#ffff00','#bfff00','#80ff00','#40ff00',
                            '#00ff00','#00ff40','#00ff80','#00ffbf','#00ffff','#00bfff','#0080ff','#0040ff',
                            '#0000ff','#4000ff','#8000ff','#bf00ff','#ff00ff','#ff00bf','#ff0080','#ff0040',
                            '#ff6666','#ff9966','#ffcc66','#ffff66','#ccff66','#99ff66','#66ff66','#66ff99',
                            '#66ffcc','#66ffff','#66ccff','#6699ff','#6666ff','#9966ff','#cc66ff','#ff66ff',
                            '#ff9999','#ffcc99','#ffee99','#ffff99','#eeff99','#ccff99','#99ff99','#99ffcc',
                            '#99ffff','#99ccff','#99aaff','#9999ff','#cc99ff','#ee99ff','#ff99ff','#ff99cc',
                            '#804000','#a0522d','#8b4513','#a97454','#c0c0c0','#9e9e9e','#6e6e6e','#2e2e2e'
                          ].map((hex,i) => (
                            <div key={i} onClick={() => setNewColorHex(hex)} title={hex}
                              className="w-6 h-6 cursor-pointer"
                              style={{ clipPath: 'polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0% 50%)', backgroundColor: hex, border: newColorHex===hex? '2px solid #fff':'1px solid #444' }} />
                          ))}
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="Name (optional)"
                            className="w-full p-1 text-black rounded"
                          />
                        </div>
                        <button
                          className="mt-2 px-2 py-1 bg-blue-600 rounded"
                          onClick={() => {
                            const name = newColorName || 'Hex Color';
                            const a = {
                              id: uid(),
                              name,
                              kind: 'color',
                              color: newColorHex,
                              defaultEngine: 'canvas',
                              allowedEngines: ['grid','canvas'],
                              defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.6, snap: false },
                            };
                            setAssets((prev) => [a, ...prev]);
                            setSelectedAssetId(a.id);
                            setEngine(a.defaultEngine);
                            setCanvasColor(a.color);
                            setShowAddColor(false);
                            setNewColorName('');
                          }}
                        >
                          Add Selected Color
                        </button>
                      </div>
                      )}
                      {addColorMode === 'flow' && (
                      <div>
                        <div className="text-xs mb-1">Flow (experimental)</div>
                        <div className="text-xs">Hue</div>
                        <input type="range" min="0" max="360" value={flowHue} onChange={(e) => setFlowHue(parseInt(e.target.value))} className="w-full" />
                        <div className="text-xs mt-1">Saturation</div>
                        <input type="range" min="0" max="100" value={flowSat} onChange={(e) => setFlowSat(parseInt(e.target.value))} className="w-full" />
                        <div className="text-xs mt-1">Lightness</div>
                        <input type="range" min="0" max="100" value={flowLight} onChange={(e) => setFlowLight(parseInt(e.target.value))} className="w-full" />
                        <div className="mt-2 h-8 rounded" style={{ backgroundColor: `hsl(${flowHue} ${flowSat}% ${flowLight}%)` }} />
                        <div className="mt-2">
                          <input
                            type="text"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="Name (optional)"
                            className="w-full p-1 text-black rounded"
                          />
                        </div>
                        <button
                          className="mt-2 px-2 py-1 bg-blue-600 rounded"
                          onClick={() => {
                            const hex = (() => {
                              const h = flowHue / 360, s = flowSat / 100, l = flowLight / 100;
                              const f = (n) => {
                                const k = (n + h * 12) % 12;
                                const a = s * Math.min(l, 1 - l);
                                const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
                                return Math.round(255 * c);
                              };
                              const r = f(0), g = f(8), b = f(4);
                              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            })();
                            const name = newColorName || "Flow Color";
                            const a = {
                              id: uid(),
                              name,
                              kind: "color",
                              color: hex,
                              defaultEngine: "canvas",
                              allowedEngines: ["grid", "canvas"],
                              defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.6, snap: false },
                            };
                            setAssets((prev) => [a, ...prev]);
                            setSelectedAssetId(a.id);
                            setEngine(a.defaultEngine);
                            setCanvasColor(a.color);
                            setShowAddColor(false);
                            setNewColorName("");
                          }}
                        >
                          Add Flow Color
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {assets.filter((a)=> assetGroup==='image'? a.kind==='image' : assetGroup==='token' ? a.kind==='token' : a.kind==='color').map((a) => (
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
                      {a.kind === "image" || a.kind === 'token' ? (
                        showAssetPreviews ? (
                          <img src={a.src} alt={a.name} className="w-full h-12 object-contain" />
                        ) : (
                          <div className="w-full h-12 flex items-center justify-center text-xs font-medium truncate">{a.name}</div>
                        )
                      ) : (
                        <div className="w-full h-12 rounded" style={{ backgroundColor: a.color || "#cccccc" }} />
                      )}
                      {showAssetPreviews && (
                        <div className="mt-1 truncate">{a.name}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ENGINE (HOW) */}
              {assetGroup !== 'token' && (
                <div>
                  <h3 className="font-bold text-sm mb-2">Engine</h3>
                  <div className="flex gap-2">
                    <button disabled={!selectedAsset?.allowedEngines?.includes("grid")} onClick={() => setEngine("grid")} className={`px-2 py-1 rounded ${engine === "grid" ? "bg-blue-600" : "bg-gray-700"}`}>Grid</button>
                    <button disabled={!selectedAsset?.allowedEngines?.includes("canvas")} onClick={() => setEngine("canvas")} className={`px-2 py-1 rounded ${engine === "canvas" ? "bg-blue-600" : "bg-gray-700"}`}>Canvas</button>
                  </div>
                </div>
              )}

              {/* INTERACTION MODE (always visible) */}
              <div className="mt-4">
                <h3 className="font-bold text-sm mb-2">Interaction <span className="ml-2 text-[10px] bg-gray-700 rounded px-1 py-0.5">Press V to toggle</span></h3>
                <div className="flex gap-2">
                  <button onClick={() => setInteractionMode("draw")} className={`px-2 py-1 rounded ${interactionMode === "draw" ? "bg-blue-600" : "bg-gray-700"}`}>Draw</button>
                  <button onClick={() => setInteractionMode("select")} className={`px-2 py-1 rounded ${interactionMode === "select" ? "bg-blue-600" : "bg-gray-700"}`}>Select</button>
                </div>
              </div>

              {/* SETTINGS: Grid or Token */}
              {(engine === "grid" || interactionMode === "select") && (
                <div>
                  {!selectedToken ? (
                    <>
                      <h3 className="font-bold text-sm mb-2">{assetGroup === 'token' ? 'Token Settings' : 'Grid Settings'}</h3>
                      <div className="grid gap-2">
                        <label className="block text-xs">Size (tiles)</label>
                        <input type="range" min="1" max="20" value={gridSettings.sizeTiles} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, sizeTiles: parseInt(e.target.value) })); }} />
                        <label className="block text-xs">Rotation</label>
                        <input type="range" min="0" max="359" value={gridSettings.rotation} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, rotation: parseInt(e.target.value) })); }} />
                        <div className="flex gap-2">
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipX} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipX: e.target.checked })); }} />{" "}Flip X</label>
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipY} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipY: e.target.checked })); }} />{" "}Flip Y</label>
                        </div>
                        <label className="block text-xs">Opacity</label>
                        <input className="w-full" type="range" min="0.05" max="1" step="0.05" value={gridSettings.opacity} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) })); }} />
                        {assetGroup !== 'token' && (
                          <label className="text-xs inline-flex items-center gap-2 mt-1"><input type="checkbox" checked={!!gridSettings.smartAdjacency} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, smartAdjacency: e.target.checked })); }} /> Smart Adjacency</label>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-sm mb-2">Token Settings</h3>
                      <div className="grid gap-2">
                        <label className="block text-xs">Size (tiles)</label>
                        <input type="range" min="1" max="20" value={gridSettings.sizeTiles} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, sizeTiles: parseInt(e.target.value) })); }} />
                        <label className="block text-xs">Rotation</label>
                        <input type="range" min="0" max="359" value={gridSettings.rotation} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, rotation: parseInt(e.target.value) })); }} />
                        <div className="flex gap-2">
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipX} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipX: e.target.checked })); }} />{" "}Flip X</label>
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipY} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipY: e.target.checked })); }} />{" "}Flip Y</label>
                        </div>
                        <label className="block text-xs">Opacity</label>
                        <input className="w-full" type="range" min="0.05" max="1" step="0.05" value={gridSettings.opacity} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) })); }} />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="text-xs">Name
                          <input type="text" className="w-full p-1 text-black rounded" value={selectedToken?.meta?.name || ''} onChange={(e) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, name: e.target.value } })} />
                        </label>
                        <label className="text-xs">HP
                          <input type="number" className="w-full p-1 text-black rounded" value={selectedToken?.meta?.hp ?? 0} onChange={(e) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, hp: parseInt(e.target.value)||0 } })} />
                        </label>
                        <label className="text-xs">Initiative
                          <input type="number" className="w-full p-1 text-black rounded" value={selectedToken?.meta?.initiative ?? 0} onChange={(e) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, initiative: parseInt(e.target.value)||0 } })} />
                        </label>
                        <label className="text-xs inline-flex items-center gap-2">
                          <input type="checkbox" checked={tokenHUDVisible} onChange={(e)=> setTokenHUDVisible(e.target.checked)} /> Show Token HUD
                        </label>
                      </div>
                        {/* Glow color */}
                        <div className="mt-2">
                          <label className="text-xs">Glow Color</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={selectedToken.glowColor || '#7dd3fc'}
                              onChange={(e) => updateTokenById(selectedToken.id, { glowColor: e.target.value })}
                              className="w-10 h-6 p-0 border border-gray-500 rounded"
                              title="Token glow color"
                            />
                            <input
                              type="text"
                              className="flex-1 p-1 text-black rounded"
                              value={selectedToken.glowColor || '#7dd3fc'}
                              onChange={(e) => updateTokenById(selectedToken.id, { glowColor: e.target.value })}
                              placeholder="#7dd3fc"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* CANVAS BRUSH */}
              {assetGroup !== 'token' && engine === "canvas" && (
                <CanvasBrushControls
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  canvasOpacity={canvasOpacity}
                  setCanvasOpacity={setCanvasOpacity}
                  canvasSpacing={canvasSpacing}
                  setCanvasSpacing={setCanvasSpacing}
                  canvasBlendMode={canvasBlendMode}
                  setCanvasBlendMode={setCanvasBlendMode}
                  canvasSmoothing={canvasSmoothing}
                  setCanvasSmoothing={setCanvasSmoothing}
                  tileSize={tileSize}
                  snapshotSettings={snapshotSettings}
                />
              )}
              


                            {/* LAYERS */}
              <div className="mt-4">
                <h3 className="font-bold text-sm mb-2">Layers</h3>
                <div className="flex gap-2 mb-2">
                  <button className="px-2 py-1 bg-gray-700 rounded" onClick={showAllLayers}>Show All</button>
                  <button className="px-2 py-1 bg-gray-700 rounded" onClick={hideAllLayers}>Hide All</button>
                </div>
                <div className="space-y-2">
                  {LAYERS.map((l) => (
                    <div key={l} className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setCurrentLayer(l)}
                        className={`px-2 py-1 rounded text-left flex-1 ${currentLayer === l ? "bg-blue-600" : "bg-gray-700"}`}
                      >
                        {l}
                      </button>
                      <button
                        onClick={() => toggleLayerVisibility(l)}
                        className={`px-2 py-1 rounded ${layerVisibility[l] ? "bg-green-700" : "bg-gray-700"}`}
                        title={layerVisibility[l] ? "Visible" : "Hidden"}
                      >
                        {layerVisibility[l] ? "Visible" : "Hidden"}
                      </button>
                    </div>
                  ))}
                  {/* Token Layer row */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInteractionMode('select')}
                      className={`px-2 py-1 rounded text-left flex-1 ${selectedToken ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      tokens
                    </button>
                    <button
                      onClick={() => setTokensVisible((v) => !v)}
                      className={`px-2 py-1 rounded ${tokensVisible ? 'bg-green-700' : 'bg-gray-700'}`}
                      title={tokensVisible ? 'Visible' : 'Hidden'}
                    >
                      {tokensVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <MapStatus selectedAsset={selectedAsset} engine={engine} currentLayer={currentLayer} layerVisibility={layerVisibility} />
            </div>
          </div>
        )}

        {/* CENTERED DRAW AREA */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="w-full h-full overflow-auto"
            style={{
              backgroundImage:
                "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              backgroundColor: "#f4e4c1",
            }}
          >
            <div className="min-w-full min-h-full flex justify-center items-start md:items-center p-6">
              <Grid
                maps={maps}
                objects={objects}
                tokens={tokens}
                assets={assets}
                engine={engine}
                selectedAsset={selectedAsset}
                gridSettings={gridSettings}
                brushSize={brushSize}
                canvasOpacity={canvasOpacity}
                canvasColor={canvasColor}
                canvasSpacing={canvasSpacing}
                canvasBlendMode={canvasBlendMode}
                canvasSmoothing={canvasSmoothing}
                isErasing={isErasing}
                interactionMode={interactionMode}
                tileSize={tileSize}
                scrollRef={scrollRef}
                canvasRefs={canvasRefs}
                currentLayer={currentLayer}
                layerVisibility={layerVisibility}
                tokensVisible={tokensVisible}
                tokenHUDVisible={tokenHUDVisible}
                assetGroup={assetGroup}
                onBeginTileStroke={onBeginTileStroke}
                onBeginCanvasStroke={onBeginCanvasStroke}
                onBeginObjectStroke={onBeginObjectStroke}
                onBeginTokenStroke={onBeginTokenStroke}
                placeTiles={placeTiles}
                addObject={addObject}
                eraseObjectAt={eraseObjectAt}
                moveObject={moveObject}
                removeObjectById={removeObjectById}
                updateObjectById={updateObjectById}
                onSelectionChange={handleSelectionChange}
                addToken={addToken}
                moveToken={moveToken}
                removeTokenById={removeTokenById}
                updateTokenById={updateTokenById}
                onTokenSelectionChange={handleTokenSelectionChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



















