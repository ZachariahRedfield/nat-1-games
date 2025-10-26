import MapStatus from "./MapStatus";
import React, { useRef, useState, useEffect } from "react";
import Grid from "../../Map/Grid/Grid";
import { saveProject as saveProjectManager, saveProjectAs as saveProjectAsManager, loadProjectFromDirectory, listMaps, deleteMap, loadGlobalAssets, saveGlobalAssets, loadAssetsFromStoredParent, chooseAssetsFolder, isAssetsFolderConfigured, hasCurrentProjectDir, clearCurrentProjectDir } from "./saveLoadManager";

import { LAYERS, uid, deepCopyGrid, deepCopyObjects, makeGrid } from "./utils";
import BrushSettings from "./BrushSettings";
import NumericInput from "../../common/NumericInput";
import TextCommitInput from "../../common/TextCommitInput";
import SaveSelectionDialog from "./SaveSelectionDialog";
import Header from "./Header";
import LayerBar from "./LayerBar";
import AssetPanel from "./AssetPanel";
import AssetCreator from "./AssetCreator";

// Compact tool icons for Interaction area
const BrushIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 12c2 0 3-.8 3-2l5.2-5.2 2 2L7 12c-.8.8-2 .9-3 .9H2z" />
    <path d="M10 2l4 4 1-1c.6-.6.6-1.4 0-2l-2-2c-.6-.6-1.4-.6-2 0l-1 1z" />
  </svg>
);
const CursorIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 2l8 6-4 1 1 4-2 1-1-4-4-1z" />
  </svg>
);
const EraserIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 10l5-5 4 4-5 5H3l-2-2 4-4z" />
    <path d="M7 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);
const GridIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
  </svg>
);
const CanvasIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M8 2c1.2 2 4 4 4 7a4 4 0 11-8 0c0-3 2.8-5 4-7z" />
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h9l3 3v9H2z" />
    <path d="M4 2h6v4H4zM4 11h8v2H4z" fill="currentColor" />
  </svg>
);
const ZoomIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function MapBuilder({ goBack, session, onLogout }) {
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
  const [selectedObjsList, setSelectedObjsList] = useState([]);

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
  const [selectedTokensList, setSelectedTokensList] = useState([]);
  const [tokenHUDVisible, setTokenHUDVisible] = useState(true);
  const [tokenHUDShowInitiative, setTokenHUDShowInitiative] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // ====== App notifications (custom UI instead of browser dialogs)
  const [toasts, setToasts] = useState([]); // [{id, text, kind}]
  const toastIdRef = useRef(1);
  const showToast = (text, kind = 'info', ttl = 2500) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttl);
  };

  const [promptState, setPromptState] = useState(null); // { title, defaultValue, resolve }
  const promptInputRef = useRef(null);
  const promptUser = (title, defaultValue = '') =>
    new Promise((resolve) => setPromptState({ title, defaultValue: defaultValue ?? '', resolve }));

  const [confirmState, setConfirmState] = useState(null); // { title, message, okText, cancelText, resolve }
  const confirmUser = (message, { title = 'Confirm', okText = 'OK', cancelText = 'Cancel' } = {}) =>
    new Promise((resolve) => setConfirmState({ title, message, okText, cancelText, resolve }));

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
  const gridContentRef = useRef(null);
  const [zoomToolActive, setZoomToolActive] = useState(false);
  // Zoom scrubber (stationary slider)
  const zoomScrubRef = useRef(null);
  const zoomScrubStartX = useRef(0);
  const zoomScrubLastX = useRef(0);
  const zoomScrubTimerRef = useRef(null);
  const zoomScrubPosRef = useRef(0);
  const [zoomScrubPos, setZoomScrubPos] = useState(0); // -1..1 for visual offset
  React.useEffect(() => { zoomScrubPosRef.current = zoomScrubPos; }, [zoomScrubPos]);
  const handleZoomScrubStart = (e) => {
    e.preventDefault();
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    zoomScrubStartX.current = clientY;
    zoomScrubLastX.current = clientY;

    const updateVisualPos = (cy) => {
      const rect = zoomScrubRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const centerY = rect.top + rect.height / 2;
      const half = Math.max(1, rect.height / 2);
      const n = (cy - centerY) / half;
      const clamped = Math.max(-1, Math.min(1, n));
      setZoomScrubPos(clamped);
      zoomScrubPosRef.current = clamped;
      return clamped;
    };

    updateVisualPos(clientY);
    // Start continuous zoom interval (constant rate) while displaced
    const startInterval = () => {
      if (zoomScrubTimerRef.current) return;
      zoomScrubTimerRef.current = window.setInterval(() => {
        const pos = zoomScrubPosRef.current || 0;
        if (pos > 0) {
          // Zoom in at constant step
          setTileSize((s) => {
            let next = s + 2; // smaller increment
            next = Math.max(8, Math.min(128, next));
            return Math.round(next / 2) * 2;
          });
        } else if (pos < 0) {
          // Zoom out at constant step
          setTileSize((s) => {
            let next = s - 2; // smaller increment
            next = Math.max(8, Math.min(128, next));
            return Math.round(next / 2) * 2;
          });
        }
      }, 300);
    };
    const stopInterval = () => {
      if (zoomScrubTimerRef.current) {
        clearInterval(zoomScrubTimerRef.current);
        zoomScrubTimerRef.current = null;
      }
    };

    startInterval();

    const onMove = (ev) => {
      const cy = ev.clientY ?? (ev.touches && ev.touches[0]?.clientY) ?? zoomScrubLastX.current;
      zoomScrubLastX.current = cy;
      updateVisualPos(cy);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
       stopInterval();
      setZoomScrubPos(0);
      zoomScrubPosRef.current = 0;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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
  // Visual grid line toggle
  const [showGridLines, setShowGridLines] = useState(true);

  // ====== ASSETS (WHAT) ======
  // Asset: { id, name, kind: 'image'|'color', src?, aspectRatio?, defaultEngine, allowedEngines, defaults:{...}, img? }
  const [assets, setAssets] = useState(() => []);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetGroup, setAssetGroup] = useState("image"); // 'image' | 'token' | 'material' | 'natural'
  const [showAssetKindMenu, setShowAssetKindMenu] = useState(false);

    // ====== Zoom Tool (rectangle zoom) ======
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const snap = (v, step = 4) => Math.round(v / step) * step;
  const handleZoomToRect = ({ left, top, width, height }) => {
    const container = scrollRef.current;
    const content = gridContentRef.current;
    if (!container || !content) return;
    // Snapshot current view for undo
    setUndoStack((prev) => [
      ...prev,
      { type: 'view', tileSize, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop },
    ]);
    setRedoStack([]);

    const prev = tileSize;
    if (width < 8 || height < 8) return;

    // Desired scale to fit rect into viewport
    const scaleX = container.clientWidth / width;
    const scaleY = container.clientHeight / height;
    let next = clamp(snap(prev * Math.min(scaleX, scaleY), 4), 8, 128);
    // Nudge at least one step in
    if (next <= prev) next = clamp(prev + 8, 8, 128);

    // Selection center as ratio within content
    const contentWidthPrev = cols * prev;
    const contentHeightPrev = rows * prev;
    let rx = (left + width / 2) / (contentWidthPrev || 1);
    let ry = (top + height / 2) / (contentHeightPrev || 1);
    rx = clamp(rx, 0, 1);
    ry = clamp(ry, 0, 1);

    // Content offset inside scroll container (centering/padding)
    const containerRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const contentOffsetLeft = contentRect.left - containerRect.left + container.scrollLeft;
    const contentOffsetTop = contentRect.top - containerRect.top + container.scrollTop;

    setTileSize(next);
    const centerAfterPaint = () => {
      const contentWidthNext = cols * next;
      const contentHeightNext = rows * next;
      const desiredLeft = contentOffsetLeft + rx * contentWidthNext - container.clientWidth / 2;
      const desiredTop = contentOffsetTop + ry * contentHeightNext - container.clientHeight / 2;
      // Clamp within actual content bounds
      const minLeft = Math.max(0, contentOffsetLeft);
      const minTop = Math.max(0, contentOffsetTop);
      const maxLeft = Math.max(minLeft, contentOffsetLeft + contentWidthNext - container.clientWidth);
      const maxTop = Math.max(minTop, contentOffsetTop + contentHeightNext - container.clientHeight);
      container.scrollTo({
        left: clamp(desiredLeft, minLeft, maxLeft),
        top: clamp(desiredTop, minTop, maxTop),
      });
    };
    // Wait for layout to reflect new tile size
    requestAnimationFrame(() => requestAnimationFrame(centerAfterPaint));
  };
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') setZoomToolActive(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // ====== ENGINE (HOW) ======
  // "grid" (snap to tiles) or "canvas" (free brush)
  const getAsset = (id) => assets.find((a) => a.id === id) || null;
  const selectedAsset = getAsset(selectedAssetId);
  const [engine, setEngine] = useState(
    selectedAsset?.defaultEngine || "grid"
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
      ensureSelectionBy((x) => x.kind === "token" || x.kind === 'tokenGroup');
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
    sizeCols: 1,
    sizeRows: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true, // engine toggle essentially
    snapStep: 1,
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
  const [editingAsset, setEditingAsset] = useState(null);
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
  const updateAssetById = (id, updated) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  };
  const mapAssetToCreatorKind = (a) => {
    if (!a) return 'image';
    if (a.kind === 'color') return 'material';
    if (a.kind === 'natural') return 'natural';
    if (a.kind === 'token' || a.kind === 'tokenGroup') return 'token';
    if (a.kind === 'image' && a.labelMeta) return 'text';
    return 'image';
  };
  const openEditAsset = (a) => {
    setEditingAsset(a);
    setCreatorKind(mapAssetToCreatorKind(a));
    setCreatorOpen(true);
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

  // ====== Global assets: load on mount, persist on change ======
  const globalAssetsRef = useRef([]);
  const [needsAssetsFolder, setNeedsAssetsFolder] = useState(false);
  const persistTimerRef = useRef(null);
  useEffect(() => {
    (async () => {
      // If assets folder is configured and permitted, do not show prompt
      const configured = await isAssetsFolderConfigured();
      if (configured) setNeedsAssetsFolder(false);

      const fsAssets = await loadAssetsFromStoredParent();
      if (Array.isArray(fsAssets)) {
        // Even if empty, we respect configured status and avoid prompting
        globalAssetsRef.current = fsAssets;
        setAssets(fsAssets);
        if (fsAssets[0]) setSelectedAssetId(fsAssets[0].id);
      } else {
        // No FS assets available (no permission / not configured), prompt user
        setNeedsAssetsFolder(true);
        const global = await loadGlobalAssets();
        if (Array.isArray(global) && global.length) {
          globalAssetsRef.current = global;
          setAssets(global);
          if (global[0]) setSelectedAssetId(global[0].id);
        }
      }
    })();
    return () => {
      if (persistTimerRef.current) { clearTimeout(persistTimerRef.current); persistTimerRef.current = null; }
    };
  }, []);

  const promptChooseAssetsFolder = async () => {
    const res = await chooseAssetsFolder();
    if (res?.ok) {
      setNeedsAssetsFolder(false);
      const list = res.assets || [];
      globalAssetsRef.current = list;
      setAssets(list);
      if (list[0]) setSelectedAssetId(list[0].id);
    }
  };

  // ====== Load Maps Modal ======
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [mapsList, setMapsList] = useState([]);
  const openLoadModal = async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) {
      setNeedsAssetsFolder(true);
      showToast('Select an Account Save Folder first.', 'warning');
      return;
    }
    const items = await listMaps();
    setMapsList(items || []);
    setLoadModalOpen(true);
  };
  const handleLoadMapFromList = async (entry) => {
    if (!entry?.dirHandle) return;
    const res = await loadProjectFromDirectory(entry.dirHandle);
    if (!res?.ok || !res?.data) return;
    const data = res.data;
    setRowsInput(String(Math.min(200, data.rows || 20)));
    setColsInput(String(Math.min(200, data.cols || 20)));
    if (data.maps) setMaps(data.maps);
    if (data.objects) setObjects(data.objects);
    if (data.tokens) setTokens(data.tokens);
    if (data.assets) {
      const hydrated = data.assets.map((a) => {
        if ((a.kind === 'image' || a.kind === 'token') && a.src && !a.img) {
          const img = new Image(); img.src = a.src; return { ...a, img };
        }
        return a;
      });
      setAssets(hydrated);
      if (hydrated[0]) setSelectedAssetId(hydrated[0].id);
      globalAssetsRef.current = hydrated;
    }
    projectNameRef.current = data.name || data.settings?.name || 'My Map';
    // canvases
    setTimeout(() => {
      if (data.canvases) {
        for (const layer of ['background','base','sky']) {
          const dataUrl = data.canvases?.[layer]; if (!dataUrl) continue;
          const canvas = canvasRefs[layer]?.current; if (!canvas) continue;
          const ctx = canvas.getContext('2d'); const img = new Image();
          img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); };
          img.src = dataUrl;
        }
      } else if (data.canvasDataUrl) {
        const canvas = canvasRefs.base?.current; if (canvas) { const ctx = canvas.getContext('2d'); const img = new Image(); img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); }; img.src = data.canvasDataUrl; }
      }
    }, 0);
    setLoadModalOpen(false);
    showToast('Project loaded.', 'success');
  };

  const handleDeleteMapFromList = async (entry) => {
    if (!entry?.folderName) return;
    const ok = await confirmUser(`Delete map "${entry.name || entry.folderName}"?\nThis cannot be undone.`, { title: 'Delete Map', okText: 'Delete', cancelText: 'Cancel' });
    if (!ok) return;
    const res = await deleteMap(entry.folderName);
    if (!res?.ok) { showToast(res?.message || 'Failed to delete map.', 'error'); return; }
    showToast('Map deleted.', 'success');
    const items = await listMaps();
    setMapsList(items || []);
  };
  useEffect(() => {
    if (!assets) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => { saveGlobalAssets(assets); }, 400);
  }, [assets]);
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
    // Update tokens array
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    // Keep the selectedToken in sync so controlled inputs don't reset while typing
    setSelectedToken((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
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
          row < o.row + o.hTiles &&
          col >= o.col &&
          col < o.col + o.wTiles;
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
    
} else if (entry.type === 'view') {
      const c = scrollRef.current;
      setUndoStack((u) => [
        ...u,
        { type: 'view', tileSize, scrollLeft: c ? c.scrollLeft : 0, scrollTop: c ? c.scrollTop : 0 },
      ]);
      setTileSize(entry.tileSize);
      requestAnimationFrame(() => {
        const cc = scrollRef.current;
        if (!cc) return;
        cc.scrollTo({ left: entry.scrollLeft || 0, top: entry.scrollTop || 0 });
      });
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
    
} else if (entry.type === 'view') {
      const c = scrollRef.current;
      setUndoStack((u) => [
        ...u,
        { type: 'view', tileSize, scrollLeft: c ? c.scrollLeft : 0, scrollTop: c ? c.scrollTop : 0 },
      ]);
      setTileSize(entry.tileSize);
      requestAnimationFrame(() => {
        const cc = scrollRef.current;
        if (!cc) return;
        cc.scrollTo({ left: entry.scrollLeft || 0, top: entry.scrollTop || 0 });
      });
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

  // ====== save / load (desktop FS API + mobile bundle fallback) ======
  const saveProject = async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) { setNeedsAssetsFolder(true); showToast('Select an Account Save Folder to save.', 'warning'); return; }
    // If a project folder is already loaded in this session, save without prompting for a name
    const hasLoaded = hasCurrentProjectDir?.() === true;
    if (!hasLoaded) {
      const defaultName = (projectNameRef.current || 'My Map');
      const nm = await promptUser('Name this map', defaultName);
      if (!nm && nm !== '') return; // cancel
      projectNameRef.current = (nm || defaultName);
    }
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
    const projectState = {
      version: 1,
      name: projectNameRef.current,
      rows,
      cols,
      tileSize,
      maps,
      objects,
      tokens,
      assets: (assetsAfter || assets),
      settings: {
        activeLayer: currentLayer,
        brushSize,
        snapToGrid: !!gridSettings?.snap,
        engine,
        layerVisibility,
        tokensVisible,
        tokenHUDVisible,
        tokenHUDShowInitiative,
        assetGroup,
        showGridLines,
        canvasOpacity,
        canvasSpacing,
        canvasBlendMode,
        canvasSmoothing,
        gridSettings,
        naturalSettings,
      },
    };

    // Save to current project dir if present; else behave like Save As (first-time save)
    const res = hasLoaded
      ? await saveProjectManager(projectState, { canvasRefs, mapName: projectNameRef.current })
      : await saveProjectAsManager(projectState, { canvasRefs, mapName: projectNameRef.current });
    if (!res?.ok) showToast("Failed to save project. Try export.", 'error');
    else {
      showToast(res.message || "Project saved.", 'success');
      // Refresh assets from the selected Assets folder
      const fsAssets = await loadAssetsFromStoredParent();
      if (Array.isArray(fsAssets) && fsAssets.length) {
        globalAssetsRef.current = fsAssets;
        setAssets(fsAssets);
        if (fsAssets[0]) setSelectedAssetId(fsAssets[0].id);
      }
    }
  };

  const saveProjectAs = async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) { setNeedsAssetsFolder(true); showToast('Select an Account Save Folder to save.', 'warning'); return; }
    const defaultName = (projectNameRef.current || 'My Map');
    const nm = await promptUser('Save As - map name', defaultName);
    if (!nm && nm !== '') return; // cancel
    projectNameRef.current = (nm || defaultName);
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
    const projectState = {
      version: 1,
      name: projectNameRef.current,
      rows,
      cols,
      tileSize,
      maps,
      objects,
      tokens,
      assets: (assetsAfter || assets),
      settings: {
        activeLayer: currentLayer,
        brushSize,
        snapToGrid: !!gridSettings?.snap,
        engine,
        layerVisibility,
        tokensVisible,
        tokenHUDVisible,
        tokenHUDShowInitiative,
        assetGroup,
        showGridLines,
        canvasOpacity,
        canvasSpacing,
        canvasBlendMode,
        canvasSmoothing,
        gridSettings,
        naturalSettings,
      },
    };
    const res = await saveProjectAsManager(projectState, { canvasRefs, mapName: projectNameRef.current });
    if (!res?.ok) showToast("Failed to save project.", 'error');
    else {
      showToast(res.message || "Project saved.", 'success');
      const fsAssets = await loadAssetsFromStoredParent();
      if (Array.isArray(fsAssets) && fsAssets.length) {
        globalAssetsRef.current = fsAssets;
        setAssets(fsAssets);
        if (fsAssets[0]) setSelectedAssetId(fsAssets[0].id);
      }
    }
  };

  const loadProject = async () => {
    const res = await loadProjectManager();
    if (!res?.ok || !res?.data) return;
    const data = res.data;

    setRowsInput(String(Math.min(200, data.rows || 20)));
    setColsInput(String(Math.min(200, data.cols || 20)));
    if (data.maps) setMaps(data.maps);
    if (data.objects) setObjects(data.objects);
    if (data.tokens) setTokens(data.tokens);

    if (data.assets) {
      const hydrated = data.assets.map((a) => {
        if ((a.kind === 'image' || a.kind === 'token') && a.src && !a.img) {
          const img = new Image();
          img.src = a.src;
          return { ...a, img };
        }
        return a;
      });
      setAssets(hydrated);
      if (hydrated[0]) setSelectedAssetId(hydrated[0].id);
      globalAssetsRef.current = hydrated;
    }

    // Update project name reference
    projectNameRef.current = data.name || data.settings?.name || 'My Map';

    // Draw per-layer overlay canvases if present; else legacy single canvas
    setTimeout(() => {
      if (data.canvases) {
        for (const layer of ['background','base','sky']) {
          const dataUrl = data.canvases?.[layer];
          if (!dataUrl) continue;
          const canvas = canvasRefs[layer]?.current;
          if (!canvas) continue;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = dataUrl;
        }
      } else if (data.canvasDataUrl) {
        const canvas = canvasRefs.base?.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = data.canvasDataUrl;
        }
      }
    }, 0);

    showToast('Project loaded.', 'success');
  };

  // Project name remembered across saves; updated on load
  const projectNameRef = useRef('My Map');

  // ====== upload image -> new asset ======
  const handleUpload = async (file) => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const aspectRatio = img.width / img.height || 1;
      const defaultName = file.name.replace(/\.[^/.]+$/, "");
      const nameInput = await promptUser('Name this asset', defaultName);
      const name = (nameInput ?? defaultName) || defaultName;
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

  const handleSelectionChange = (objOrArr) => {
    const arr = Array.isArray(objOrArr) ? objOrArr : (objOrArr ? [objOrArr] : []);
    if (arr.length) {
      // We just selected something: remember user's current controls ONCE
      if (!hasSelection) gridDefaultsRef.current = { ...gridSettings };
      setHasSelection(true);
      setSelectedObjsList(arr);
      const obj = arr[arr.length - 1];
      setSelectedObj(obj);

      // Sync controls to the selected object's properties
      setGridSettings((s) => ({
        ...s,
        sizeTiles: Math.max(1, Math.round(obj.wTiles || 1)),
        sizeCols: Math.max(1, Math.round(obj.wTiles || 1)),
        sizeRows: Math.max(1, Math.round(obj.hTiles || 1)),
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
      setSelectedObjsList([]);
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

  const handleTokenSelectionChange = (tokOrArr) => {
    const arr = Array.isArray(tokOrArr) ? tokOrArr : (tokOrArr ? [tokOrArr] : []);
    if (arr.length) {
      setSelectedTokensList(arr);
      const tok = arr[arr.length - 1];
      setSelectedToken(tok);
      setGridSettings((s) => ({
        ...s,
        sizeTiles: Math.max(1, Math.round(tok.wTiles || 1)),
        sizeCols: Math.max(1, Math.round(tok.wTiles || 1)),
        sizeRows: Math.max(1, Math.round(tok.hTiles || 1)),
        rotation: tok.rotation || 0,
        flipX: false,
        flipY: false,
        opacity: tok.opacity ?? 1,
      }));
    } else {
      setSelectedToken(null);
      setSelectedTokensList([]);
    }
  };

  // ====== Save current selection as a new image asset ======
  const saveSelectionAsAsset = async () => {
    const obj = selectedObj;
    if (!obj) return;
    const asset = assets.find((a) => a.id === obj.assetId);
    if (!asset) return;
    const wPx = Math.max(1, Math.round(obj.wTiles * tileSize));
    const hPx = Math.max(1, Math.round(obj.hTiles * tileSize));

    const renderAndSave = async (imgSrc) => {
      const canvas = document.createElement('canvas');
      canvas.width = wPx; canvas.height = hPx;
      const ctx = canvas.getContext('2d');
      const baseImg = new Image();
      baseImg.onload = async () => {
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
      const nameInput = await promptUser('Name this saved asset', nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
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
      baseImg.src = imgSrc;
    };

    if (asset.kind === 'image') {
      renderAndSave(asset.img?.src || asset.src);
    } else if (asset.kind === 'natural') {
      const idx = obj.variantIndex || 0;
      const src = Array.isArray(asset.variants) && asset.variants[idx] ? asset.variants[idx].src : null;
      if (!src) return;
      renderAndSave(src);
      // Switch to Images group so the newly saved asset is visible
      try { setAssetGroup('image'); } catch {}
    } else {
      // not supported
      return;
    }
  };

  // Save currently selected token as a new token asset
  const saveSelectedTokenAsAsset = async () => {
    const tok = selectedToken;
    if (!tok) return;
    const asset = assets.find((a) => a.id === tok.assetId);
    if (!asset) return;
    const wPx = Math.max(1, Math.round((tok.wTiles || 1) * tileSize));
    const hPx = Math.max(1, Math.round((tok.hTiles || 1) * tileSize));
    const canvas = document.createElement('canvas');
    canvas.width = wPx; canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    const baseImg = new Image();
    baseImg.onload = async () => {
      ctx.save();
      ctx.translate(wPx / 2, hPx / 2);
      const rot = ((tok.rotation || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale(tok.flipX ? -1 : 1, tok.flipY ? -1 : 1);
      ctx.globalAlpha = tok.opacity ?? 1;
      ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
      const dataUrl = canvas.toDataURL('image/png');
      const nameDefault = `${asset.name}-variant`;
      const nameInput = await promptUser('Name this saved token', nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
      const newAsset = {
        id: uid(),
        name,
        kind: 'token',
        src: dataUrl,
        aspectRatio: wPx / hPx || 1,
        defaultEngine: 'grid',
        allowedEngines: [],
        defaults: { sizeTiles: tok.wTiles || 1, opacity: tok.opacity ?? 1, snap: true },
        glowDefault: tok.glowColor || asset.glowDefault || '#7dd3fc',
      };
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setAssetGroup('token');
      setEngine('grid');
    };
    baseImg.src = asset.src;
  };

  const saveCurrentSelection = async () => {
    if ((selectedTokensList?.length || 0) > 0 && (selectedObjsList?.length || 0) > 0) {
      showToast('Mixed selection not supported. Select only images or only tokens.', 'warning', 3500);
      return;
    }
    // Multi-token selection -> token group
    if (selectedTokensList && selectedTokensList.length > 1) {
      return saveSelectedTokensAsGroup(selectedTokensList);
    }
    // Multi-object selection -> prompt: natural variants or merged image
    if (selectedObjsList && selectedObjsList.length > 1) {
      const choice = await confirmUser('Save as Natural group?\nOK: Natural Group (each selection becomes a variant)\nCancel: Merge into single Image');
      if (choice) return saveMultipleObjectsAsNaturalGroup(selectedObjsList);
      return saveMultipleObjectsAsMergedImage(selectedObjsList);
    }
    if (selectedToken) return saveSelectedTokenAsAsset();
    if (selectedObj) return saveSelectionAsAsset();
  };

  // Save multiple selected image/natural objects as a Natural asset (variants)
  const saveMultipleObjectsAsNaturalGroup = async (objs) => {
    const variants = [];
    for (const obj of objs) {
      const asset = assets.find((a) => a.id === obj.assetId);
      if (!asset) continue;
      let srcToUse = null;
      if (asset.kind === 'image') srcToUse = asset.img?.src || asset.src;
      else if (asset.kind === 'natural') {
        const idx = obj.variantIndex || 0;
        srcToUse = Array.isArray(asset.variants) && asset.variants[idx] ? asset.variants[idx].src : null;
      }
      if (!srcToUse) continue;
      const wPx = Math.max(1, Math.round(obj.wTiles * tileSize));
      const hPx = Math.max(1, Math.round(obj.hTiles * tileSize));
      const canvas = document.createElement('canvas');
      canvas.width = wPx; canvas.height = hPx;
      const ctx = canvas.getContext('2d');
      const baseImg = new Image();
      await new Promise((res)=>{ baseImg.onload = res; baseImg.src = srcToUse; });
      ctx.save();
      ctx.translate(wPx / 2, hPx / 2);
      const rot = ((obj.rotation || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
      ctx.globalAlpha = obj.opacity ?? 1;
      ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
      const dataUrl = canvas.toDataURL('image/png');
      variants.push({ src: dataUrl, aspectRatio: wPx / hPx || 1 });
    }
    if (!variants.length) return;
    const nameDefault = 'Natural Group';
    const nameInput = await promptUser('Name this Natural group', nameDefault);
    const name = (nameInput ?? nameDefault) || nameDefault;
    const newAsset = {
      id: uid(),
      name,
      kind: 'natural',
      variants,
      defaultEngine: 'grid',
      allowedEngines: [],
      defaults: { sizeTiles: 1, opacity: 1, snap: true },
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setAssetGroup('natural');
    setEngine('grid');
  };

  // Save multiple selected image/natural objects as a merged image asset
  const saveMultipleObjectsAsMergedImage = async (objs) => {
    if (!objs?.length) return;
    const minRow = Math.min(...objs.map((o)=> o.row));
    const minCol = Math.min(...objs.map((o)=> o.col));
    const maxRow = Math.max(...objs.map((o)=> o.row + o.hTiles));
    const maxCol = Math.max(...objs.map((o)=> o.col + o.wTiles));
    const wPx = Math.max(1, Math.round((maxCol - minCol) * tileSize));
    const hPx = Math.max(1, Math.round((maxRow - minRow) * tileSize));
    const canvas = document.createElement('canvas');
    canvas.width = wPx; canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    for (const obj of objs) {
      const asset = assets.find((a) => a.id === obj.assetId);
      if (!asset) continue;
      let srcToUse = null;
      if (asset.kind === 'image') srcToUse = asset.img?.src || asset.src;
      else if (asset.kind === 'natural') {
        const idx = obj.variantIndex || 0;
        srcToUse = Array.isArray(asset.variants) && asset.variants[idx] ? asset.variants[idx].src : null;
      }
      if (!srcToUse) continue;
      const baseImg = new Image();
      await new Promise((res)=>{ baseImg.onload = res; baseImg.src = srcToUse; });
      const wObj = Math.max(1, Math.round(obj.wTiles * tileSize));
      const hObj = Math.max(1, Math.round(obj.hTiles * tileSize));
      const cx = Math.round((obj.col - minCol) * tileSize + wObj / 2);
      const cy = Math.round((obj.row - minRow) * tileSize + hObj / 2);
      ctx.save();
      ctx.translate(cx, cy);
      const rot = ((obj.rotation || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
      ctx.globalAlpha = obj.opacity ?? 1;
      ctx.drawImage(baseImg, -wObj / 2, -hObj / 2, wObj, hObj);
      ctx.restore();
    }
    const dataUrl = canvas.toDataURL('image/png');
    const nameDefault = 'Merged Image';
    const nameInput = await promptUser('Name this merged image', nameDefault);
    const name = (nameInput ?? nameDefault) || nameDefault;
    const newImg = new Image();
    newImg.src = dataUrl;
    const newAsset = {
      id: uid(),
      name,
      kind: 'image',
      src: dataUrl,
      aspectRatio: wPx / hPx || 1,
      defaultEngine: 'grid',
      allowedEngines: ['grid','canvas'],
      defaults: { sizeTiles: 1, opacity: 1, snap: true },
      img: newImg,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setAssetGroup('image');
    setEngine('grid');
  };

  // Save a group of selected tokens as a tokenGroup asset
  const saveSelectedTokensAsGroup = async (toks) => {
    if (!toks?.length) return;
    // Sort left-to-right for default order
    const ordered = [...toks].sort((a,b)=> (a.col - b.col) || (a.row - b.row));
    const members = ordered.map((t)=> ({ assetId: t.assetId }));
    const nameDefault = 'Token Group';
    const nameInput = await promptUser('Name this token group', nameDefault);
    const name = (nameInput ?? nameDefault) || nameDefault;
    const newAsset = {
      id: uid(),
      name,
      kind: 'tokenGroup',
      members,
      defaultEngine: 'grid',
      allowedEngines: [],
      defaults: { sizeTiles: 1, opacity: 1, snap: true },
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setAssetGroup('token');
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
  const onBackClick = () => { try { clearCurrentProjectDir(); } catch {} ; goBack?.(); };
  return (
    <div className="w-full h-full flex flex-col">
      <Header
        showToolbar={showToolbar}
        onToggleToolbar={() => setShowToolbar((s) => !s)}
        onUndo={undo}
        onRedo={redo}
        onSave={saveProject}
        onSaveAs={saveProjectAs}
        onLoad={openLoadModal}
        onBack={onBackClick}
        session={session}
        onLogout={onLogout}
      />

      {needsAssetsFolder && (
        <div className="bg-amber-800 text-amber-100 border-b border-amber-600 px-4 py-2 flex items-center justify-between">
          <div className="text-sm">Select an Assets folder to enable saving/loading assets across projects.</div>
          <button className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs" onClick={promptChooseAssetsFolder}>Choose Assets Folder</button>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* TOASTS */}
        <div className="fixed top-3 right-3 z-[10050] space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className={`px-3 py-2 rounded shadow text-sm border ${t.kind==='error'?'bg-red-800/90 border-red-600 text-red-50': t.kind==='success'?'bg-emerald-800/90 border-emerald-600 text-emerald-50': t.kind==='warning'?'bg-amber-800/90 border-amber-600 text-amber-50':'bg-gray-800/90 border-gray-600 text-gray-50'}`}>
              {t.text}
            </div>
          ))}
        </div>

        {/* PROMPT MODAL */}
        {promptState && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60">
            <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
              <div className="font-semibold mb-2">{promptState.title || 'Input'}</div>
              <input
                autoFocus
                defaultValue={promptState.defaultValue || ''}
                ref={promptInputRef}
                className="w-full p-2 rounded text-black mb-3"
                onKeyDown={(e)=> { if (e.key === 'Enter') {
                  const val = e.currentTarget.value;
                  promptState.resolve(val);
                  setPromptState(null);
                }}}
              />
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 bg-gray-700 rounded" onClick={()=> { promptState.resolve(null); setPromptState(null); }}>Cancel</button>
                <button className="px-3 py-1 bg-blue-600 rounded" onClick={()=> {
                  const val = promptInputRef && promptInputRef.current ? promptInputRef.current.value : (promptState.defaultValue || '');
                  promptState.resolve(val);
                  setPromptState(null);
                }}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM MODAL */}
        {confirmState && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60">
            <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
              <div className="font-semibold mb-2">{confirmState.title || 'Confirm'}</div>
              <div className="whitespace-pre-wrap text-sm mb-3">{confirmState.message || ''}</div>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 bg-gray-700 rounded" onClick={()=> { confirmState.resolve(false); setConfirmState(null); }}>{confirmState.cancelText || 'Cancel'}</button>
                <button className="px-3 py-1 bg-blue-600 rounded" onClick={()=> { confirmState.resolve(true); setConfirmState(null); }}>{confirmState.okText || 'OK'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ASSET CREATOR MODAL */}
        {creatorOpen && (
          <div className="fixed inset-0 z-[10057] flex items-center justify-center bg-black/60">
            <div className="w-[96%] max-w-2xl max-h-[86vh] overflow-auto bg-gray-900 border border-gray-700 rounded text-gray-100">
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <div className="font-semibold">{editingAsset ? 'Edit Asset' : 'Create Asset'}</div>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={()=> { setCreatorOpen(false); setEditingAsset(null); }}>Close</button>
              </div>
              <div className="p-3">
                <AssetCreator
                  kind={creatorKind}
                  onClose={() => { setCreatorOpen(false); setEditingAsset(null); }}
                  onCreate={handleCreatorCreate}
                  onUpdate={(updated)=> {
                    if (!editingAsset) return;
                    updateAssetById(editingAsset.id, updated);
                  }}
                  initialAsset={editingAsset}
                  selectedImageSrc={selectedAsset?.kind==='image' ? selectedAsset?.src : null}
                  mode={editingAsset ? 'edit' : 'create'}
                />
              </div>
            </div>
          </div>
        )}

        {/* LOAD MAPS MODAL */}
        {loadModalOpen && (
          <div className="fixed inset-0 z-[10055] flex items-center justify-center bg-black/60">
            <div className="w-[96%] max-w-2xl max-h-[80vh] overflow-hidden bg-gray-900 border border-gray-700 rounded text-gray-100">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="font-semibold">Load Map</div>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={()=> setLoadModalOpen(false)}>Close</button>
              </div>
              <div className="p-3 overflow-auto" style={{ maxHeight: '64vh' }}>
                {mapsList.length === 0 ? (
                  <div className="text-sm text-gray-300">No maps found. Use Save or Save As to create one.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mapsList.map((m, idx) => (
                      <div key={idx} className="text-left px-3 py-2 border border-gray-700 rounded bg-gray-800">
                        <div className="font-medium truncate">{m.name || m.folderName}</div>
                        <div className="text-xs text-gray-300 truncate">Folder: {m.folderName}</div>
                        {m.mtime ? (<div className="text-[10px] text-gray-400">Updated: {new Date(m.mtime).toLocaleString()}</div>) : null}
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded" onClick={()=> handleLoadMapFromList(m)}>Open</button>
                          <button className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 rounded" onClick={()=> handleDeleteMapFromList(m)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* TOOLBAR */}
        {showToolbar && (
          <div className="w-72 bg-gray-800 text-white border-r-2 border-gray-600 flex flex-col min-h-0">
            <div className="p-4 space-y-5 overflow-y-auto">
              {/* MAP SIZE / ZOOM */}
              <div className="mb-2">
                <h3 className="font-bold text-sm mb-2">Map Size</h3>
                <div className="flex items-start justify-between gap-4">
                  {/* Row/Col + Apply group (left) */}
                  <div className="inline-grid grid-cols-[auto_auto] gap-x-1 gap-y-1 items-center">
                    <div className="text-xs text-gray-300">Row</div>
                    <NumericInput
                      value={parseInt(rowsInput) || 0}
                      min={1}
                      max={200}
                      step={1}
                      onCommit={(n)=> setRowsInput(String(n))}
                      className="box-border w-12 px-1 py-0.5 text-xs text-black rounded"
                    />
                    <div className="text-xs text-gray-300">Col</div>
                    <NumericInput
                      value={parseInt(colsInput) || 0}
                      min={1}
                      max={200}
                      step={1}
                      onCommit={(n)=> setColsInput(String(n))}
                      className="box-border w-12 px-1 py-0.5 text-xs text-black rounded"
                    />
                    <div></div>
                    <button className="box-border w-16 px-1 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs" onClick={updateGridSizes}>Apply</button>
                  </div>

                  {/* Zoom group (right) */}
                  <div className="flex items-start gap-2 ml-auto -mt-4">
                    {/* Label above percentage (left of bar) */}
                    <div className="flex flex-col items-end">
                      <div className="text-xs mb-0.5">Zoom</div>
                      <div className="text-xs w-12 text-right">{Math.round((tileSize/32)*100)}%</div>
                    </div>
                    {/* Scrubber and +/- vertically (rightmost, closer to edge) */}
                    <div className="flex flex-col items-end gap-1">
                      <button className="px-1.5 py-0.5 text-xs bg-gray-700 rounded" onClick={()=> setTileSize((s)=> Math.max(8, Math.round((s-2)/2)*2))}>-</button>
                      <div
                        ref={zoomScrubRef}
                        onMouseDown={handleZoomScrubStart}
                        className="relative w-3 h-12 bg-gray-700 rounded cursor-ns-resize select-none"
                        title="Drag up/down to adjust zoom"
                      >
                        {/* center mark */}
                        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-500/70" />
                        {/* handle */}
                        <div
                          className="absolute left-0 right-0 top-1/2"
                          style={{ transform: `translateY(${(zoomScrubPos||0)*22}px) translateY(-50%)` }}
                        >
                          <div className="w-3 h-2 bg-gray-300 rounded-sm shadow-inner ml-auto" />
                        </div>
                      </div>
                      <button className="px-1.5 py-0.5 text-xs bg-gray-700 rounded" onClick={()=> setTileSize((s)=> Math.min(128, Math.round((s+2)/2)*2))}>+</button>
                    </div>
                  </div>
                </div>
              </div>
              {/* ASSETS (WHAT) */}
              <AssetPanel
                assetGroup={assetGroup}
                setAssetGroup={setAssetGroup}
                showAssetKindMenu={showAssetKindMenu}
                setShowAssetKindMenu={setShowAssetKindMenu}
                showAssetPreviews={showAssetPreviews}
                setShowAssetPreviews={setShowAssetPreviews}
                assets={assets}
                selectedAssetId={selectedAssetId}
                selectedAsset={selectedAsset}
                selectAsset={selectAsset}
                tokens={tokens}
                objects={objects}
                creatorOpen={creatorOpen}
                creatorKind={creatorKind}
                editingAsset={editingAsset}
                openCreator={openCreator}
                setCreatorOpen={setCreatorOpen}
                setEditingAsset={setEditingAsset}
                handleCreatorCreate={handleCreatorCreate}
                updateAssetById={updateAssetById}
                setAssets={setAssets}
                setSelectedAssetId={setSelectedAssetId}
                alertFn={(msg) => showToast(msg, 'warning', 3500)}
                confirmFn={(msg) => confirmUser(msg)}
              />

              {/* INTERACTION MODE (two-row contextual) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">Interaction</h3>
                </div>
                {/* Row 1: Mode segmented (+ Zoom Tool) */}
                <div className="inline-flex items-center gap-0 bg-gray-700/40 border border-gray-600 rounded overflow-hidden">
                  <button
                    onClick={() => { setZoomToolActive(false); setInteractionMode("draw"); }}
                    title="Draw"
                    aria-label="Draw"
                    className={`px-3 py-1 text-sm relative group ${(!zoomToolActive && interactionMode === "draw") ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                  >
                    <BrushIcon className="w-4 h-4" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Draw</div>
                  </button>
                  <button
                    onClick={() => { setZoomToolActive(false); setInteractionMode("select"); }}
                    title="Select"
                    aria-label="Select"
                    className={`px-3 py-1 text-sm relative group ${(!zoomToolActive && interactionMode === "select") ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                  >
                    <CursorIcon className="w-4 h-4" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Select</div>
                  </button>
                  <button
                    onClick={() => setZoomToolActive((v)=> !v)}
                    title="Zoom Tool: drag a rectangle to zoom"
                    aria-label="Zoom Tool"
                    className={`px-3 py-1 text-sm relative group ${zoomToolActive ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                  >
                    <ZoomIcon className="w-4 h-4" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Zoom</div>
                  </button>
                </div>
                {/* Row 2: Context */}
                <div className="mt-2 flex items-center gap-2">
                  {interactionMode === 'draw' ? (
                    <>
                      {assetGroup !== 'token' && (
                        <div className="inline-flex items-center gap-0 bg-gray-700/40 border border-gray-600 rounded overflow-hidden">
                          <button
                            onClick={() => setEngine("grid")}
                            title="Grid"
                            aria-label="Grid"
                            className={`px-3 py-1 text-sm relative group ${engine === "grid" ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                          >
                            <GridIcon className="w-4 h-4" />
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Grid</div>
                          </button>
                          <button
                            onClick={() => setEngine("canvas")}
                            title="Canvas"
                            aria-label="Canvas"
                            className={`px-3 py-1 text-sm relative group ${engine === "canvas" ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                          >
                            <CanvasIcon className="w-4 h-4" />
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Canvas</div>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setIsErasing((s) => !s)}
                        className={`px-3 py-1 text-sm border rounded relative group ${isErasing ? 'bg-red-700 border-red-600' : 'bg-gray-700/40 border-gray-600'}`}
                        title={`Eraser: ${isErasing ? 'On' : 'Off'}`}
                        aria-label={`Eraser: ${isErasing ? 'On' : 'Off'}`}
                      >
                        <EraserIcon className="w-4 h-4" />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Eraser: {isErasing ? 'On' : 'Off'}</div>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSaveDialogOpen(true)}
                      disabled={((selectedObjsList?.length||0) === 0) && ((selectedTokensList?.length||0) === 0)}
                      className={`px-3 py-1 text-sm border rounded relative group ${ (((selectedObjsList?.length||0) > 0) || ((selectedTokensList?.length||0) > 0)) ? 'bg-amber-600 border-amber-500 hover:bg-amber-500' : 'bg-gray-700/40 border-gray-600 cursor-not-allowed'}`}
                      title="Save selected as a new asset"
                      aria-label="Save"
                    >
                      <span className="inline-flex items-center gap-2">
                        <SaveIcon className="w-4 h-4" />
                        <span className="text-xs">Save</span>
                      </span>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Save</div>
                    </button>
                  )}
                </div>
              </div>

              {/* SETTINGS (Brush) or Token */}
              {(engine === "grid" || interactionMode === "select") && (
                <div>
                  {!selectedToken ? (
                    <>
                      {interactionMode === 'select' && (selectedObjsList?.length || 0) > 1 ? (
                        <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
                          Multiple selected — settings locked. Save as a group to edit parent settings later.
                        </div>
                      ) : (
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
                      )}

                      {/* Label Settings when selecting a label/text object */}
                      {selectedObj && ((selectedObjsList?.length || 0) <= 1) && (() => {
                        const a = assets.find((x) => x.id === selectedObj.assetId);
                        return a && a.kind === 'image' && a.labelMeta;
                      })() && (
                        <div className="mt-3">
                          <h3 className="font-bold text-sm mb-2">Label Settings</h3>
                          {(() => { const a = assets.find((x)=> x.id === selectedObj.assetId) || {}; const lm = a.labelMeta || {}; return (
                            <div className="grid gap-2">
                              <label className="text-xs">Text
                                <TextCommitInput className="w-full p-1 text-black rounded" value={lm.text || ''} onCommit={(v)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, text: v }); }} />
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs">Color
                                  <input type="color" className="w-full h-8 p-0 border border-gray-500 rounded" value={lm.color || '#ffffff'} onChange={(e)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, color: e.target.value }); }} />
                                </label>
                                <label className="text-xs">Font Size
                                  <NumericInput
                                    value={lm.size || 28}
                                    min={8}
                                    max={128}
                                    step={1}
                                    onCommit={(v)=> { snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, size: v }); }}
                                    className="w-12 px-1 py-0.5 text-xs text-black rounded"
                                  />
                                </label>
                                <label className="text-xs col-span-2">Font Family
                                  <TextCommitInput className="w-full p-1 text-black rounded" value={lm.font || 'Arial'} onCommit={(v)=>{ snapshotSettings(); regenerateLabelInstance(selectedObj.assetId, { ...lm, font: v }); }} />
                                </label>
                              </div>
                            </div>
                          ); })()}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {(selectedTokensList?.length || 0) > 1 ? (
                        <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
                          Multiple tokens selected — settings locked. Save as a Token Group to manage as a set.
                        </div>
                      ) : (
                        <>
                        <h3 className="font-bold text-sm mb-2">Token Settings</h3>
                        <div className="grid gap-2">
                        <label className="block text-xs">Size (tiles)</label>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-xs">Cols (X)</span>
                            <NumericInput
                              value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                              min={1}
                              max={100}
                              step={1}
                              className="w-12 px-1 py-0.5 text-xs text-black rounded"
                              onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings(); setGridSettings((s) => ({ ...s, sizeCols: n })); }}
                            />
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <span className="text-xs">Rows (Y)</span>
                            <NumericInput
                              value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                              min={1}
                              max={100}
                              step={1}
                              className="w-12 px-1 py-0.5 text-xs text-black rounded"
                              onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings(); setGridSettings((s) => ({ ...s, sizeRows: n })); }}
                            />
                          </div>
                        </div>
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
                          <TextCommitInput className="w-full p-1 text-black rounded" value={selectedToken?.meta?.name || ''} onCommit={(v) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, name: v } })} />
                        </label>
                        <label className="text-xs">HP
                          <NumericInput
                            value={selectedToken?.meta?.hp ?? 0}
                            min={-9999}
                            max={999999}
                            step={1}
                            onCommit={(v) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, hp: Math.round(v) } })}
                            className="w-12 px-1 py-0.5 text-xs text-black rounded"
                          />
                        </label>
                        <label className="text-xs">Initiative
                          <NumericInput
                            value={selectedToken?.meta?.initiative ?? 0}
                            min={-99}
                            max={999}
                            step={1}
                            onCommit={(v) => updateTokenById(selectedToken.id, { meta: { ...selectedToken.meta, initiative: Math.round(v) } })}
                            className="w-12 px-1 py-0.5 text-xs text-black rounded"
                          />
                        </label>
                        <label className="text-xs inline-flex items-center gap-2">
                          <input type="checkbox" checked={tokenHUDVisible} onChange={(e)=> setTokenHUDVisible(e.target.checked)} /> Show Token HUD
                        </label>
                        <label className="text-xs inline-flex items-center gap-2">
                          <input type="checkbox" checked={tokenHUDShowInitiative} onChange={(e)=> setTokenHUDShowInitiative(e.target.checked)} /> Show Initiative in HUD
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
            <LayerBar
              currentLayer={currentLayer}
              setCurrentLayer={setCurrentLayer}
              layerVisibility={layerVisibility}
              toggleLayerVisibility={toggleLayerVisibility}
              showAllLayers={showAllLayers}
              hideAllLayers={hideAllLayers}
              tokensVisible={tokensVisible}
              setTokensVisible={setTokensVisible}
              showGridLines={showGridLines}
              setShowGridLines={setShowGridLines}
            />
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
                contentRef={gridContentRef}
                zoomToolActive={zoomToolActive}
                onZoomToolRect={handleZoomToRect}
                canvasRefs={canvasRefs}
                currentLayer={currentLayer}
                layerVisibility={layerVisibility}
                tokensVisible={tokensVisible}
                tokenHUDVisible={tokenHUDVisible}
                tokenHUDShowInitiative={tokenHUDShowInitiative}
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
                showGridLines={showGridLines}
              />
            </div>
          </div>
        </div>
      </main>

      <SaveSelectionDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        selectedObjsList={selectedObjsList}
        selectedTokensList={selectedTokensList}
        saveSelectionAsAsset={saveSelectionAsAsset}
        saveMultipleObjectsAsNaturalGroup={saveMultipleObjectsAsNaturalGroup}
        saveMultipleObjectsAsMergedImage={saveMultipleObjectsAsMergedImage}
        saveSelectedTokenAsAsset={saveSelectedTokenAsAsset}
        saveSelectedTokensAsGroup={saveSelectedTokensAsGroup}
      />
    </div>
  );
}



































