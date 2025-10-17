import MapStatus from "./MapStatus";
import React, { useRef, useState } from "react";
import Grid from "../../Map/Grid/Grid";

import { LAYERS, uid, deepCopyGrid, deepCopyObjects, makeGrid } from "./utils";
import CanvasBrushControls from "./CanvasBrushControls";
import BrushSettings from "./BrushSettings";
import AssetCreator from "./AssetCreator";

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
    sky: false, // start with sky layer hidden
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
  const [assetGroup, setAssetGroup] = useState("image"); // 'image' | 'token' | 'material' | 'natural'
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
    // Close any open creator when selecting an existing asset
    setCreatorOpen(false);
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

  // When asset group changes, auto-select a matching asset and force Grid engine for Token/Natural groups
  React.useEffect(() => {
    const ensureSelectionBy = (pred) => {
      const cur = selectedAsset;
      const ok = cur && pred(cur);
      if (ok) return;
      const next = assets.find(pred);
      if (next) setSelectedAssetId(next.id);
    };
    // Close any open asset creator when changing groups
    setCreatorOpen(false);
    if (assetGroup === "image") ensureSelectionBy((x) => x.kind === "image");
    else if (assetGroup === "material") ensureSelectionBy((x) => x.kind === "color");
    else if (assetGroup === "token") {
      ensureSelectionBy((x) => x.kind === "token");
      setEngine("grid");
    } else if (assetGroup === "natural") {
      ensureSelectionBy((x) => x.kind === "natural");
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
    snapStep: 0.25,
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
  // Legacy add-* panels removed in favor of unified AssetCreator
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorKind, setCreatorKind] = useState('image');
  const openCreator = (k) => { setCreatorKind(k); setCreatorOpen(true); };
  const handleCreatorCreate = (asset, group) => {
    if (!asset) return;
    const withId = { ...asset, id: uid() };
    if (withId.kind === 'image') {
      // ensure img present if src exists
      if (!withId.img && withId.src) {
        const im = new Image();
        im.src = withId.src;
        withId.img = im;
      }
    }
    setAssets((prev)=> [withId, ...prev]);
    setAssetGroup(group === 'material' ? 'material' : group === 'natural' ? 'natural' : group === 'token' ? 'token' : 'image');
    setSelectedAssetId(withId.id);
    setEngine('grid');
    setCreatorOpen(false);
  };
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
  // Natural randomization settings
  const [naturalSettings, setNaturalSettings] = useState({
    randomRotation: false,
    randomFlipX: false,
    randomFlipY: false,
    randomSize: { enabled: false, min: 1, max: 1 },
    randomOpacity: { enabled: false, min: 1, max: 1 },
    randomVariant: true,
  });
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
          naturalSettings: { ...naturalSettings },
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
            naturalSettings: { ...naturalSettings },
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
      if (entry.settings.naturalSettings)
        setNaturalSettings(entry.settings.naturalSettings);
    } else if (entry.type === 'bundle') {
      // undo combined assets + objects change
      setRedoStack((r) => [
        ...r,
        {
          type: 'bundle',
          layer: entry.layer,
          assets: assets.map((a) => ({ ...a })),
          objects: deepCopyObjects(objects[entry.layer] || []),
        },
      ]);
      if (entry.assets) setAssets(entry.assets.map((a) => ({ ...a })));
      if (entry.objects) setObjects((prev) => ({ ...prev, [entry.layer]: deepCopyObjects(entry.objects) }));
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
            naturalSettings: { ...naturalSettings },
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
      if (entry.settings.naturalSettings)
        setNaturalSettings(entry.settings.naturalSettings);
    } else if (entry.type === 'bundle') {
      setUndoStack((u) => [
        ...u,
        {
          type: 'bundle',
          layer: entry.layer,
          assets: assets.map((a) => ({ ...a })),
          objects: deepCopyObjects(objects[entry.layer] || []),
        },
      ]);
      if (entry.assets) setAssets(entry.assets.map((a) => ({ ...a })));
      if (entry.objects) setObjects((prev) => ({ ...prev, [entry.layer]: deepCopyObjects(entry.objects) }));
    }
  };

  // ====== save / load (tiles + objects; canvas pixels not persisted yet) ======
  const saveProject = () => {
    // Clean up hidden, unreferenced assets before saving
    const { assetsAfter } = (function(){
      try {
        const referenced = new Set();
        for (const l of LAYERS) {
          for (const o of (objects[l] || [])) referenced.add(o.assetId);
        }
        for (const t of (tokens || [])) referenced.add(t.assetId);
        const newAssets = assets.filter((a) => !a.hiddenFromUI || referenced.has(a.id));
        const removedCount = assets.length - newAssets.length;
        if (removedCount > 0) {
          setUndoStack((prev) => [
            ...prev,
            { type: 'bundle', layer: currentLayer, assets: assets.map((x) => ({ ...x })) },
          ]);
          setRedoStack([]);
          setAssets(newAssets);
        }
        return { assetsAfter: newAssets };
      } catch {
        return { assetsAfter: assets };
      }
    })();
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
      assets: (assetsAfter || assets).map(({ img, ...a }) => a), // strip in-memory img
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

  // ====== create Natural asset -> image variants ======
  const handleCreateNatural = async (filesOrVariants, nameInput) => {
    const name = (nameInput || 'Natural').trim() || 'Natural';
    let variants = [];
    if (!filesOrVariants) return;
    if (filesOrVariants instanceof FileList || Array.isArray(filesOrVariants) && filesOrVariants[0] instanceof File) {
      const fileArr = Array.from(filesOrVariants || []).slice(0, 16);
      if (!fileArr.length) return;
      const readOne = (file) =>
        new Promise((resolve) => {
          const src = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            resolve({ src, aspectRatio: (img.width && img.height) ? img.width / img.height : 1 });
          };
          img.src = src;
        });
      variants = await Promise.all(fileArr.map(readOne));
    } else {
      // assume precomputed variant list [{src, aspectRatio}]
      variants = Array.isArray(filesOrVariants) ? filesOrVariants.slice(0, 16) : [];
    }
    const a = {
      id: uid(),
      name,
      kind: 'natural',
      variants,
      defaultEngine: 'grid',
      allowedEngines: [],
      defaults: { sizeTiles: 1, opacity: 1, snap: true },
    };
    setAssets((prev) => [a, ...prev]);
    setSelectedAssetId(a.id);
    setAssetGroup('natural');
    setEngine('grid');
    // legacy panel closed; unified creator handles natural creation
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

  // ====== Label asset update per-instance (clone asset, reassign object) ======
  const regenerateLabelInstance = (assetId, meta) => {
    const a = assets.find((x) => x.id === assetId);
    if (!a || !selectedObj) return;
    // Snapshot for undo (assets + current layer objects)
    setUndoStack((prev) => [
      ...prev,
      {
        type: 'bundle',
        layer: currentLayer,
        assets: assets.map((x) => ({ ...x })),
        objects: deepCopyObjects(objects[currentLayer] || []),
      },
    ]);
    setRedoStack([]);
    const text = (meta?.text ?? a.labelMeta?.text ?? 'Label');
    const size = Math.max(8, Math.min(128, parseInt(meta?.size ?? a.labelMeta?.size ?? 28) || 28));
    const color = meta?.color ?? a.labelMeta?.color ?? '#ffffff';
    const font = meta?.font ?? a.labelMeta?.font ?? 'Arial';
    const padding = Math.round(size * 0.35);

    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    mctx.font = `${size}px ${font}`;
    const metrics = mctx.measureText(text);
    const textW = Math.ceil(metrics.width);
    const textH = Math.ceil(size * 1.2);
    const w = Math.max(1, textW + padding * 2);
    const h = Math.max(1, textH + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${size}px ${font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
    ctx.fillText(text, padding, padding);

    const src = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      const newAsset = {
        id: uid(),
        name: a.name || text,
        kind: 'image',
        src,
        img,
        aspectRatio: img.width && img.height ? img.width / img.height : (a.aspectRatio || 1),
        defaultEngine: 'grid',
        allowedEngines: ['grid','canvas'],
        defaults: a.defaults || { sizeTiles: 1, opacity: 1, snap: true },
        hiddenFromUI: true,
        labelMeta: { text, color, font, size },
      };
      setAssets((prev) => [newAsset, ...prev]);
      // reassign currently selected object to new asset id (per-instance update)
      updateObjectById(currentLayer, selectedObj.id, { assetId: newAsset.id });
    };
    img.src = src;
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
              {/* GRID / ZOOM */}
              <div className="mb-2">
                <h3 className="font-bold text-sm mb-2">Grid</h3>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <label className="text-xs">Rows
                    <input type="number" min="1" max="200" value={rowsInput} onChange={(e)=>setRowsInput(e.target.value)} className="w-full p-1 text-black rounded" />
                  </label>
                  <label className="text-xs">Cols
                    <input type="number" min="1" max="200" value={colsInput} onChange={(e)=>setColsInput(e.target.value)} className="w-full p-1 text-black rounded" />
                  </label>
                  <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={updateGridSizes}>Apply</button>
                </div>
                <div className="mt-3">
                  <label className="block text-xs mb-1">Zoom</label>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-gray-700 rounded" onClick={()=> setTileSize((s)=> Math.max(8, s-4))}>-</button>
                    <input type="range" min="8" max="128" step="4" value={tileSize} onChange={(e)=> setTileSize(parseInt(e.target.value)||32)} className="flex-1" />
                    <button className="px-2 py-1 bg-gray-700 rounded" onClick={()=> setTileSize((s)=> Math.min(128, s+4))}>+</button>
                    <div className="text-xs w-12 text-right">{Math.round((tileSize/32)*100)}%</div>
                  </div>
                </div>
              </div>
              {/* ASSETS (WHAT) */}
              <div className="relative">
                <button
                  className="font-bold text-sm mb-2 px-2 py-1 bg-gray-700 rounded inline-flex items-center gap-2"
                  onClick={() => setShowAssetKindMenu((s)=>!s)}
                  onMouseEnter={() => setShowAssetKindMenu(true)}
                >
                  Assets
                  <span className="text-xs opacity-80">
                    {assetGroup === 'image' ? 'Image' : assetGroup === 'token' ? 'Token' : assetGroup === 'material' ? 'Materials' : 'Natural'}
                  </span>
                </button>
                {/* Inline panel that expands and pushes content */}
                <div
                  className={`overflow-y-hidden overflow-x-visible transition-[max-height,opacity] duration-200 ${
                    showAssetKindMenu ? 'max-h-[140px] opacity-100 pointer-events-auto mb-3' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div
                    className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded flex flex-wrap gap-0"
                    onMouseEnter={() => setShowAssetKindMenu(true)}
                    onMouseLeave={() => setShowAssetKindMenu(false)}
                  >
                    <button
                      className={`px-2 py-1 text-xs rounded ${assetGroup==='image'?'bg-blue-600':'bg-gray-700'}`}
                      onClick={() => { setAssetGroup('image'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
                    >
                      Image
                    </button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${assetGroup==='token'?'bg-blue-600':'bg-gray-700'}`}
                      onClick={() => { setAssetGroup('token'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
                    >
                      Token
                    </button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${assetGroup==='material'?'bg-blue-600':'bg-gray-700'}`}
                      onClick={() => { setAssetGroup('material'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
                    >
                      Materials
                    </button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${assetGroup==='natural'?'bg-blue-600':'bg-gray-700'}`}
                      onClick={() => { setAssetGroup('natural'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
                    >
                      Natural
                    </button>
                  </div>
                </div>

                {/* Creation buttons row positioned just above the ASSETS list */}
                <div className="mt-1 mb-3 flex flex-wrap items-center gap-2">
                  {assetGroup === 'image' && (
                    <>
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('image')}>Create Image</button>
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('text')}>Text/Label</button>
                    </>
                  )}
                  {assetGroup === 'natural' && (
                    <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('natural')}>Add Natural</button>
                  )}
                  {assetGroup === 'material' && (
                    <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('material')}>Add Color</button>
                  )}
                  {assetGroup === 'token' && (
                    <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('token')}>Add Token</button>
                  )}
                </div>
                {/* Asset deletion is handled in-tile within the asset grid when selected */}
                {creatorOpen && (
                  <AssetCreator
                    kind={creatorKind}
                    onClose={() => setCreatorOpen(false)}
                    onCreate={handleCreatorCreate}
                    selectedImageSrc={selectedAsset?.kind==='image' ? selectedAsset?.src : null}
                  />
                )}
                <div className="mb-2 border border-gray-600 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
                    <span className="text-xs uppercase tracking-wide">Assets</span>
                    <button className="text-xs px-2 py-0.5 bg-gray-800 rounded" onClick={() => setShowAssetPreviews((s) => !s)}>
                      {showAssetPreviews ? "Hide Previews" : "Show Previews"}
                    </button>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    {assets
                      .filter((a) => !a.hiddenFromUI)
                      .filter((a) => (
                        assetGroup === 'image'
                          ? a.kind === 'image'
                          : assetGroup === 'token'
                          ? a.kind === 'token'
                          : assetGroup === 'material'
                          ? a.kind === 'color'
                          : assetGroup === 'natural'
                          ? a.kind === 'natural'
                          : true
                      ))
                      .map((a) => (
                        <div
                          key={a.id}
                          onClick={() => selectAsset(a.id)}
                          className={`relative border rounded p-1 text-xs cursor-pointer ${
                            selectedAssetId === a.id ? 'border-blue-400 bg-blue-600/20' : 'border-gray-600 bg-gray-700/40'
                          }`}
                          title={a.name}
                        >
                          {(a.kind === 'image' || a.kind === 'token' || a.kind === 'natural') ? (
                            showAssetPreviews ? (
                              a.kind === 'natural'
                                ? (a.variants?.length
                                    ? <img src={a.variants[0]?.src} alt={a.name} className="w-full h-12 object-contain" />
                                    : <div className="w-full h-12 flex items-center justify-center text-[10px] opacity-80">0 variants</div>)
                                : (<img src={a.src} alt={a.name} className="w-full h-12 object-contain" />)
                            ) : (
                              <div className="w-full h-12 flex items-center justify-center text-xs font-medium truncate">{a.name}</div>
                            )
                          ) : (
                            <div className="w-full h-12 rounded" style={{ backgroundColor: a.color || '#cccccc' }} />
                          )}
                          {showAssetPreviews && <div className="mt-1 truncate">{a.name}</div>}
                          {selectedAssetId === a.id && (a.kind === 'image' || a.kind === 'token' || a.kind === 'natural') && (
                            <button
                              className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-700 hover:bg-red-600 rounded text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                const useCountTokens = (tokens || []).filter((t) => t.assetId === a.id).length;
                                const countInObjects = ['background', 'base', 'sky'].reduce(
                                  (acc, l) => acc + (objects?.[l] || []).filter((o) => o.assetId === a.id).length,
                                  0
                                );
                                if (a.kind === 'token' && useCountTokens > 0) {
                                  alert(`Cannot delete token asset in use by ${useCountTokens} token(s). Delete tokens first.`);
                                  return;
                                }
                                if ((a.kind === 'image' || a.kind === 'natural') && countInObjects > 0) {
                                  alert(`Cannot delete image asset in use by ${countInObjects} object(s). Delete stamps first.`);
                                  return;
                                }
                                if (confirm(`Delete asset "${a.name}"?`)) {
                                  setAssets((prev) => prev.filter((x) => x.id !== a.id));
                                  const next = assets.find(
                                    (x) => x.id !== a.id && (assetGroup === 'image' ? x.kind === 'image' : assetGroup === 'token' ? x.kind === 'token' : assetGroup === 'natural' ? x.kind === 'natural' : true)
                                  );
                                  if (next) setSelectedAssetId(next.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
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

              {/* SETTINGS (Brush) or Token */}
              {(engine === "grid" || interactionMode === "select") && (
                <div>
                  {!selectedToken ? (
                    <>
                      <BrushSettings
                        kind={interactionMode === 'select' ? 'grid' : (assetGroup === 'natural' ? 'natural' : 'grid')}
                        titleOverride={interactionMode === 'select' ? 'Settings' : undefined}
                        gridSettings={gridSettings}
                        setGridSettings={setGridSettings}
                        naturalSettings={naturalSettings}
                        setNaturalSettings={setNaturalSettings}
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

                      {/* Label Settings when selecting a label/text object */}
                      {selectedObj && (() => {
                        const a = assets.find((x) => x.id === selectedObj.assetId);
                        return a && a.kind === 'image' && a.labelMeta;
                      })() && (
                        <div className="mt-3">
                          <h3 className="font-bold text-sm mb-2">Label Settings</h3>
                          {(() => { const a = assets.find((x)=> x.id === selectedObj.assetId) || {}; const lm = a.labelMeta || {}; return (
                            <div className="grid gap-2">
                              <label className="text-xs">Text
                                <input type="text" className="w-full p-1 text-black rounded" value={lm.text || ''} onChange={(e)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, text: e.target.value }); }} />
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs">Color
                                  <input type="color" className="w-full h-8 p-0 border border-gray-500 rounded" value={lm.color || '#ffffff'} onChange={(e)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, color: e.target.value }); }} />
                                </label>
                                <label className="text-xs">Font Size
                                  <input type="number" min="8" max="128" className="w-full p-1 text-black rounded" value={lm.size || 28} onChange={(e)=>{ const v = Math.max(8, Math.min(128, parseInt(e.target.value)||28)); snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, size: v }); }} />
                                </label>
                                <label className="text-xs col-span-2">Font Family
                                  <input type="text" className="w-full p-1 text-black rounded" value={lm.font || 'Arial'} onChange={(e)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, font: e.target.value }); }} />
                                </label>
                              </div>
                            </div>
                          ); })()}
                        </div>
                      )}
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

              {/* CANVAS BRUSH SETTINGS */}
              {assetGroup !== 'token' && engine === "canvas" && interactionMode !== 'select' && (
                <BrushSettings
                  kind="canvas"
                  gridSettings={gridSettings}
                  setGridSettings={setGridSettings}
                  naturalSettings={naturalSettings}
                  setNaturalSettings={setNaturalSettings}
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
            {/* Top layer bar (slim, horizontal) */}
            <div className="sticky top-0 left-0 right-0 z-40 bg-gray-800/80 text-white backdrop-blur px-2 py-1 border-b border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase opacity-80 mr-1">Layers</span>
                <button className="px-2 py-0.5 text-[12px] bg-gray-700 rounded" onClick={showAllLayers}>Show All</button>
                <button className="px-2 py-0.5 text-[12px] bg-gray-700 rounded" onClick={hideAllLayers}>Hide All</button>
                <div className="h-4 w-px bg-gray-600 mx-1" />
                {LAYERS.map((l) => (
                  <div key={`layerbar-${l}`} className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentLayer(l)}
                      className={`px-2 py-0.5 text-[12px] rounded ${currentLayer === l ? 'bg-blue-600' : 'bg-gray-700'}`}
                      title={`Edit ${l}`}
                    >
                      {l}
                    </button>
                    <button
                      onClick={() => toggleLayerVisibility(l)}
                      className={`px-2 py-0.5 text-[12px] rounded ${layerVisibility[l] ? 'bg-gray-600' : 'bg-gray-700'}`}
                      title={layerVisibility[l] ? 'Visible' : 'Hidden'}
                    >
                      {layerVisibility[l] ? '👁' : '🚫'}
                    </button>
                  </div>
                ))}
                <div className="h-4 w-px bg-gray-600 mx-1" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTokensVisible((v) => !v)}
                    className={`px-2 py-0.5 text-[12px] rounded ${tokensVisible ? 'bg-gray-600' : 'bg-gray-700'}`}
                    title={tokensVisible ? 'Hide tokens layer' : 'Show tokens layer'}
                  >
                    tokens {tokensVisible ? '👁' : '🚫'}
                  </button>
                </div>
              </div>
            </div>
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
                naturalSettings={naturalSettings}
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



















