import MapStatus from "./MapStatus";
import React, { useRef, useState, useEffect } from "react";
import Grid from "../canvas/Grid/Grid.jsx";
import { saveProject as saveProjectManager, saveProjectAs as saveProjectAsManager, loadProjectFromDirectory, listMaps, deleteMap, loadGlobalAssets, saveGlobalAssets, loadAssetsFromStoredParent, chooseAssetsFolder, isAssetsFolderConfigured, hasCurrentProjectDir, clearCurrentProjectDir } from "../../application/save-load/index.js";

import { LAYERS, uid, deepCopyGrid, deepCopyObjects, makeGrid } from "./utils";
import BrushSettings from "./BrushSettings";
import { NumericInput, RotationWheel, TextCommitInput, SiteHeader } from "../../../shared/index.js";
import SaveSelectionDialog from "./SaveSelectionDialog";
import Header from "./Header";
import LayerBar from "./LayerBar";
import BottomAssetsDrawer from "./BottomAssetsDrawer";
import AssetCreator from "./AssetCreator";
import VerticalToolStrip from "./VerticalToolStrip";

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

// Simple hand/grab icon for Pan tool
const PanIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M6 2c.6 0 1 .4 1 1v3h1V2c0-.6.4-1 1-1s1 .4 1 1v4h1V3c0-.6.4-1 1-1s1 .4 1 1v5h1V5c0-.6.4-1 1-1s1 .4 1 1v6c0 2.2-1.8 4-4 4H7c-2.8 0-5-2.2-5-5V9c0-1.1.9-2 2-2h1V3c0-.6.4-1 1-1z" />
  </svg>
);

export default function MapBuilder({ goBack, session, onLogout, onNavigate, currentScreen }) {
  // --- dimensions ---
  const [rowsInput, setRowsInput] = useState("30");
  const [colsInput, setColsInput] = useState("30");
  const rows = Math.max(1, Math.min(200, parseInt(rowsInput) || 30));
  const cols = Math.max(1, Math.min(200, parseInt(colsInput) || 30));

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

  // Toggle showing words under Save/Save As/Load in header center
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);
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

  // Manage Map: Map Size modal
  const [mapSizeModalOpen, setMapSizeModalOpen] = useState(false);

  // --- canvas refs (per layer) ---
  const canvasRefs = {
    background: useRef(null),
    base: useRef(null),
    sky: useRef(null),
  };

  // --- view / scroll ---
  // Default zoom ~75% (32 is 100%)
  const [tileSize, setTileSize] = useState(24);
  const scrollRef = useRef(null);
  const gridContentRef = useRef(null);
  const layerBarWrapRef = useRef(null);
  const [overlayTop, setOverlayTop] = useState(40);
  const [overlayLeft, setOverlayLeft] = useState(0);
  const [overlayCenter, setOverlayCenter] = useState(0);
  const [overlayWidth, setOverlayWidth] = useState(0);
  const [layerBarHeight, setLayerBarHeight] = useState(0);
  const [fixedBarTop, setFixedBarTop] = useState(0);
  const [fixedBarLeft, setFixedBarLeft] = useState(0);
  const [fixedBarWidth, setFixedBarWidth] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = layerBarWrapRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height || 0;
      setLayerBarHeight(Math.max(0, Math.round(h)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mapsMenuOpen]);

  // Keep overlays anchored to the top-left of the MAP area (tan scroll container)
  useEffect(() => {
    const measure = () => {
      const container = scrollRef.current;
      if (!container) return;
      const cr = container.getBoundingClientRect();
      // Position just beneath the LAYERS bar by a small gap
      const insetTop = 2;
      const insetLeft = 8;
      setOverlayTop(Math.round(cr.top + (layerBarHeight || 0) + insetTop));
      setOverlayLeft(Math.round(cr.left + insetLeft));
      // Center undo/redo across the map area width
      setOverlayCenter(Math.round(cr.left + cr.width / 2));
    };
    // Measure now and again on next frames to catch late layout
    measure();
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const on = () => measure();
    const sc = scrollRef.current;
    sc?.addEventListener('scroll', on);
    window.addEventListener('resize', on);
    return () => {
      sc?.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf1);
    };
  }, [tileSize, rows, cols, layerBarHeight, mapsMenuOpen]);

  // Fixed LayerBar positioning (under header, aligned to scroll container)
  useEffect(() => {
    const measureBarPos = () => {
      const sc = scrollRef.current;
      if (!sc) return;
      const cr = sc.getBoundingClientRect();
      const offsetW = sc.offsetWidth || cr.width;
      const clientW = sc.clientWidth || cr.width;
      const innerW = Math.max(0, Math.min(offsetW, clientW));
      // Align fixed LAYERS bar to the top of the tan area
      setFixedBarTop(Math.round(cr.top));
      setFixedBarLeft(Math.round(cr.left));
      // Use inner (client) width so the fixed bar does not cover the vertical scrollbar area
      setFixedBarWidth(Math.round(innerW));
    };
    measureBarPos();
    window.addEventListener('resize', measureBarPos);
    const id = requestAnimationFrame(measureBarPos);
    return () => {
      window.removeEventListener('resize', measureBarPos);
      cancelAnimationFrame(id);
    };
  }, [mapsMenuOpen]);
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const [panToolActive, setPanToolActive] = useState(false);
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
    sky: true, // sky visible by default
  });
  // Visual grid line toggle
  const [showGridLines, setShowGridLines] = useState(true);

  // ====== ASSETS (WHAT) ======
  // Asset: { id, name, kind: 'image'|'color', src?, aspectRatio?, defaultEngine, allowedEngines, defaults:{...}, img? }
  const [assets, setAssets] = useState(() => []);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetGroup, setAssetGroup] = useState("image"); // 'image' | 'token' | 'material' | 'natural'
  const [showAssetKindMenu, setShowAssetKindMenu] = useState(true);

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
    if (a.kind === "token" || a.kind === 'tokenGroup') {
      // Tokens place on click; keep user in Draw with Grid engine
      try { setZoomToolActive(false); setPanToolActive(false); } catch {}
      setInteractionMode("draw");
      setEngine("grid");
    } else if (a.kind === "color") {
      // Do not change engine; only update the active color
      if (a.color) setCanvasColor(a.color);
    } else if (a.allowedEngines?.includes(prefer)) {
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
    sizeCols: 1,
    sizeRows: 1,
    linkXY: false,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true, // engine toggle essentially
    snapStep: 1,
    smartAdjacency: true, // neighbor-aware alignment for grid stamps
  });

  // ====== Asset drawer-only settings (per-asset defaults)
  const normalizeStamp = (d = {}) => ({
    sizeTiles: Number.isFinite(d.sizeTiles) ? d.sizeTiles : 1,
    sizeCols: Number.isFinite(d.sizeCols) ? d.sizeCols : (Number.isFinite(d.sizeTiles) ? d.sizeTiles : 1),
    sizeRows: Number.isFinite(d.sizeRows) ? d.sizeRows : (Number.isFinite(d.sizeTiles) ? d.sizeTiles : 1),
    rotation: Number.isFinite(d.rotation) ? d.rotation : 0,
    flipX: !!d.flipX,
    flipY: !!d.flipY,
    opacity: Number.isFinite(d.opacity) ? d.opacity : 1,
    snapToGrid: d.snapToGrid ?? true,
    snapStep: Number.isFinite(d.snapStep) ? d.snapStep : 1,
    linkXY: !!d.linkXY,
  });
  const [assetStamp, setAssetStamp] = useState(() => normalizeStamp());

  // Flags to avoid persisting while we're initializing defaults
  const loadingGridDefaultsRef = useRef(false);
  const loadingAssetStampDefaultsRef = useRef(false);
  const loadingNaturalDefaultsRef = useRef(false);

  // Sync gridSettings from the selected asset's saved stampDefaults
  useEffect(() => {
    if (!selectedAsset) return;
    const d = selectedAsset.stampDefaults || selectedAsset.defaults || {};
    loadingGridDefaultsRef.current = true;
    setGridSettings((s) => ({
      ...s,
      sizeTiles: Number.isFinite(d.sizeTiles) ? d.sizeTiles : (s.sizeTiles ?? 1),
      sizeCols: Number.isFinite(d.sizeCols) ? d.sizeCols : (Number.isFinite(d.sizeTiles) ? d.sizeTiles : (s.sizeCols ?? 1)),
      sizeRows: Number.isFinite(d.sizeRows) ? d.sizeRows : (Number.isFinite(d.sizeTiles) ? d.sizeTiles : (s.sizeRows ?? 1)),
      rotation: Number.isFinite(d.rotation) ? d.rotation : (s.rotation ?? 0),
      flipX: d.flipX ?? (s.flipX ?? false),
      flipY: d.flipY ?? (s.flipY ?? false),
      opacity: Number.isFinite(d.opacity) ? d.opacity : (s.opacity ?? 1),
      snapToGrid: d.snapToGrid ?? (s.snapToGrid ?? true),
      snapStep: Number.isFinite(d.snapStep) ? d.snapStep : (s.snapStep ?? 1),
      linkXY: d.linkXY ?? (s.linkXY ?? false),
    }));
    // Defer clearing flag until after React applies state and effects run
    setTimeout(() => { loadingGridDefaultsRef.current = false; }, 0);
  }, [selectedAssetId]);

  // Load drawer settings from the selected asset defaults (Assets tab only)
  useEffect(() => {
    const d = (selectedAsset?.stampDefaults || selectedAsset?.defaults || {});
    loadingAssetStampDefaultsRef.current = true;
    setAssetStamp(normalizeStamp(d));
    setTimeout(() => { loadingAssetStampDefaultsRef.current = false; }, 0);
  }, [selectedAssetId]);

  // Load Natural defaults into UI when selecting a Natural asset
  useEffect(() => {
    const a = getAsset(selectedAssetId);
    if (!a || a.kind !== 'natural') return;
    const d = a.naturalDefaults || {};
    loadingNaturalDefaultsRef.current = true;
    setNaturalSettings((cur) => ({ ...cur, ...normalizeNatural(d) }));
    setTimeout(() => { loadingNaturalDefaultsRef.current = false; }, 0);
  }, [selectedAssetId]);

  // Persist drawer settings into the selected asset (assets tab only)
  useEffect(() => {
    if (!selectedAssetId || !assetStamp) return;
    if (loadingAssetStampDefaultsRef.current) return; // skip initial load
    const cur = getAsset(selectedAssetId);
    const prev = cur?.stampDefaults || {};
    const stamp = normalizeStamp(assetStamp);
    const same = prev &&
      prev.sizeTiles === stamp.sizeTiles &&
      prev.sizeCols === stamp.sizeCols &&
      prev.sizeRows === stamp.sizeRows &&
      prev.rotation === stamp.rotation &&
      !!prev.flipX === stamp.flipX &&
      !!prev.flipY === stamp.flipY &&
      Math.abs((prev.opacity ?? 1) - (stamp.opacity ?? 1)) < 0.0001 &&
      !!prev.snapToGrid === stamp.snapToGrid &&
      (prev.snapStep ?? 1) === stamp.snapStep &&
      !!prev.linkXY === stamp.linkXY;
    if (!same) updateAssetById(selectedAssetId, { stampDefaults: stamp });
  }, [selectedAssetId, assetStamp]);

  // Also persist changes made via the main Settings panel when no selection is active
  // This saves the current gridSettings as the selected asset's defaults so they persist across sessions.
  useEffect(() => {
    if (!selectedAssetId) return;
    if (hasSelection) return; // avoid overwriting defaults while editing an existing selection
    if (loadingGridDefaultsRef.current) return; // skip initial apply
    const cur = getAsset(selectedAssetId);
    if (!cur) return;
    const stamp = normalizeStamp(gridSettings || {});
    const prev = cur.stampDefaults || {};
    const same = prev &&
      prev.sizeTiles === stamp.sizeTiles &&
      prev.sizeCols === stamp.sizeCols &&
      prev.sizeRows === stamp.sizeRows &&
      prev.rotation === stamp.rotation &&
      !!prev.flipX === stamp.flipX &&
      !!prev.flipY === stamp.flipY &&
      Math.abs((prev.opacity ?? 1) - (stamp.opacity ?? 1)) < 0.0001 &&
      !!prev.snapToGrid === stamp.snapToGrid &&
      (prev.snapStep ?? 1) === stamp.snapStep &&
      !!prev.linkXY === stamp.linkXY;
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: stamp });
      // Keep Assets drawer preview/settings in sync
      setAssetStamp(stamp);
    }
  }, [selectedAssetId, hasSelection, gridSettings]);

  

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

  // (gridSettings defined above)

  // Canvas engine (free brush)
  const [brushSize, setBrushSize] = useState(2); // in tiles
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27); // fraction of radius
  const [canvasColor, setCanvasColor] = useState(null); // used when asset.kind === 'color'
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
    // Add immediately and persist synchronously to avoid drops
    setAssets((prev)=> {
      const next = [withId, ...prev];
      try { saveGlobalAssets(next); } catch {}
      return next;
    });
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
  // Normalize Natural settings structure
  const normalizeNatural = (ns = {}) => ({
    randomRotation: !!ns.randomRotation,
    randomFlipX: !!ns.randomFlipX,
    randomFlipY: !!ns.randomFlipY,
    randomSize: {
      enabled: !!(ns.randomSize?.enabled),
      min: Number.isFinite(ns.randomSize?.min) ? ns.randomSize.min : 1,
      max: Number.isFinite(ns.randomSize?.max) ? ns.randomSize.max : 1,
    },
    randomOpacity: {
      enabled: !!(ns.randomOpacity?.enabled),
      min: Number.isFinite(ns.randomOpacity?.min) ? ns.randomOpacity.min : 1,
      max: Number.isFinite(ns.randomOpacity?.max) ? ns.randomOpacity.max : 1,
    },
    randomVariant: ns.randomVariant ?? true,
  });
  // Preserve token selection in Select mode even if Assets tab changes
  React.useEffect(() => {
    if (assetGroup !== 'token' && interactionMode !== 'select' && selectedToken) setSelectedToken(null);
  }, [assetGroup, interactionMode, selectedToken]);

  // Persist Natural settings as per-asset defaults when editing a Natural asset
  useEffect(() => {
    if (!selectedAssetId) return;
    if (hasSelection) return;
    if (loadingNaturalDefaultsRef.current) return;
    const cur = getAsset(selectedAssetId);
    if (!cur || cur.kind !== 'natural') return;
    const next = normalizeNatural(naturalSettings);
    const prev = cur.naturalDefaults || {};
    const same = !!prev &&
      !!prev.randomRotation === next.randomRotation &&
      !!prev.randomFlipX === next.randomFlipX &&
      !!prev.randomFlipY === next.randomFlipY &&
      !!(prev.randomSize?.enabled) === next.randomSize.enabled &&
      (prev.randomSize?.min ?? 1) === next.randomSize.min &&
      (prev.randomSize?.max ?? 1) === next.randomSize.max &&
      !!(prev.randomOpacity?.enabled) === next.randomOpacity.enabled &&
      (prev.randomOpacity?.min ?? 1) === next.randomOpacity.min &&
      (prev.randomOpacity?.max ?? 1) === next.randomOpacity.max &&
      (prev.randomVariant ?? true) === next.randomVariant;
    if (!same) updateAssetById(selectedAssetId, { naturalDefaults: next });
  }, [selectedAssetId, hasSelection, naturalSettings]);

  // ====== Global assets: load on mount, persist on change ======
  const globalAssetsRef = useRef([]);
  const [needsAssetsFolder, setNeedsAssetsFolder] = useState(false);
  const persistTimerRef = useRef(null);
  useEffect(() => {
    (async () => {
      // If assets folder is configured and permitted, do not show prompt
      const configured = await isAssetsFolderConfigured();
      const fsAssets = configured ? (await loadAssetsFromStoredParent()) : [];
      const global = await loadGlobalAssets();

      if (configured) setNeedsAssetsFolder(false); else setNeedsAssetsFolder(true);

      // Merge FS and global by id
      // Prefer FS entries for file paths, but carry over metadata like stampDefaults from global when FS lacks it.
      const gMap = new Map((Array.isArray(global) ? global : []).filter(Boolean).map((a) => [a.id, a]));
      const fMap = new Map((Array.isArray(fsAssets) ? fsAssets : []).filter(Boolean).map((a) => [a.id, a]));
      const allIds = new Set([...gMap.keys(), ...fMap.keys()]);
      const merged = [];
      for (const id of allIds) {
        const g = gMap.get(id);
        const f = fMap.get(id);
        if (f && g) {
          // Prefer FS for file-location fields (e.g., path), but prefer Global for metadata/defaults
          const combined = { ...f, ...g };
          merged.push(combined);
        } else if (f) {
          merged.push({ ...f });
        } else if (g) {
          merged.push({ ...g });
        }
      }

      // Secondary reconciliation: if two entries share the same name+kind but differ in id,
      // copy missing defaults (stampDefaults / naturalDefaults) from the one that has them.
      const byNameKind = new Map();
      for (const a of merged) {
        const key = `${a.kind || ''}:${(a.name || '').toLowerCase()}`;
        const cur = byNameKind.get(key);
        if (!cur) byNameKind.set(key, a);
        else {
          // If either side has defaults the other lacks, copy them over (non-destructive)
          if (!a.stampDefaults && cur.stampDefaults) a.stampDefaults = cur.stampDefaults;
          if (!cur.stampDefaults && a.stampDefaults) cur.stampDefaults = a.stampDefaults;
          if (!a.naturalDefaults && cur.naturalDefaults) a.naturalDefaults = cur.naturalDefaults;
          if (!cur.naturalDefaults && a.naturalDefaults) cur.naturalDefaults = a.naturalDefaults;
        }
      }

      globalAssetsRef.current = merged;
      setAssets(merged);
      if (merged[0]) setSelectedAssetId(merged[0].id);
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
    const r = Math.max(1, Math.min(200, parseInt(rowsInput) || 30));
    const c = Math.max(1, Math.min(200, parseInt(colsInput) || 30));
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

  // Delete current selection (objects or tokens)
  const deleteCurrentSelection = () => {
    const hasObjs = (selectedObjsList?.length || 0) > 0;
    const hasToks = (selectedTokensList?.length || 0) > 0;
    if (!hasObjs && !hasToks) return;
    if (hasToks) {
      onBeginTokenStroke?.();
      for (const t of selectedTokensList) removeTokenById?.(t.id);
      setSelectedToken(null);
      setSelectedTokensList([]);
      showToast('Deleted selected token(s).', 'success');
      return;
    }
    if (hasObjs) {
      onBeginObjectStroke?.(currentLayer);
      for (const o of selectedObjsList) removeObjectById(currentLayer, o.id);
      setSelectedObj(null);
      setSelectedObjsList([]);
      showToast('Deleted selected object(s).', 'success');
    }
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

  // No-op: Do not track settings changes in undo/redo
  const snapshotSettings = () => {};

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
      <SiteHeader session={session} onLogout={onLogout} onNavigate={onNavigate} currentScreen={currentScreen || 'mapBuilder'} />
      <Header
        onUndo={undo}
        onRedo={redo}
        onSave={saveProject}
        onSaveAs={saveProjectAs}
        onLoad={openLoadModal}
        onBack={onBackClick}
        session={session}
        onLogout={onLogout}
        showSaveWords={mapsMenuOpen}
        mapsMenuOpen={mapsMenuOpen}
        onToggleMaps={() => setMapsMenuOpen((v) => !v)}
        onOpenMapSize={() => setMapSizeModalOpen(true)}
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
        {/* TOOLBAR removed from layout (hidden) */}
        <div className="hidden">
            <div className="p-4 space-y-5 overflow-y-auto">
              {/* Assets panel removed from toolbar; lives in bottom drawer */}

              {/* Map Size controls moved to Manage Map modal */}
              {/* Interaction section removed; tool controls live on the vertical strip */}

              {/* SETTINGS (Brush) or Token */}
              {!panToolActive && !zoomToolActive && (engine === "grid" || interactionMode === "select") && (
                <div>
                  {!selectedToken ? (
                    <>
                      {interactionMode === 'select' && (selectedObjsList?.length || 0) > 1 ? (
                        <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
                          Multiple selected â€” settings locked. Save as a group to edit parent settings later.
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
                          Multiple tokens selected â€” settings locked. Save as a Token Group to manage as a set.
                        </div>
                      ) : (
                        <>
                        <h3 className="font-bold text-sm mb-2">Token Settings</h3>
                        <div className="grid gap-2">
                        <div className="flex items-end gap-3 mb-1">
                          <span className="text-xs">Size</span>
                          <div className="inline-flex items-center">
                            <div className="relative">
                              <NumericInput
                                value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                                min={1}
                                max={100}
                                step={1}
                                className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                                onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings(); setGridSettings((s) => ({ ...s, sizeCols: n })); }}
                              />
                              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
                            </div>
                          </div>
                          <div className="inline-flex items-center">
                            <div className="relative">
                              <NumericInput
                                value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                                min={1}
                                max={100}
                                step={1}
                                className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                                onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings(); setGridSettings((s) => ({ ...s, sizeRows: n })); }}
                              />
                              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
                            </div>
                          </div>
                        </div>
                        <label className="block text-xs">Rotation</label>
                        <div className="flex items-center gap-3 mb-1">
                          <NumericInput
                            value={gridSettings.rotation}
                            min={0}
                            max={359}
                            step={1}
                            className="w-12 px-1 py-0.5 text-xs text-black rounded"
                            onCommit={(v) => { const n = Math.max(0, Math.min(359, Math.round(v))); snapshotSettings(); setGridSettings((s) => ({ ...s, rotation: n })); }}
                          />
                          <RotationWheel
                            value={gridSettings.rotation}
                            onChange={(n) => { const d = Math.max(0, Math.min(359, Math.round(n))); snapshotSettings(); setGridSettings((s) => ({ ...s, rotation: d })); }}
                            size={72}
                          />
                        </div>
                        <div className="flex gap-2">
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipX} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipX: e.target.checked })); }} />{" "}Flip X</label>
                          <label className="text-xs"><input type="checkbox" checked={gridSettings.flipY} onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, flipY: e.target.checked })); }} />{" "}Flip Y</label>
                        </div>
                        <label className="block text-xs">Opacity</label>
                        <div className="w-full">
                          <style>{`.alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:24px; margin:0; }
                          .alpha-range:focus{ outline:none; }
                          .alpha-range::-webkit-slider-runnable-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
                          .alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:4px; margin-top:-2px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }
                          .alpha-range::-moz-range-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
                          .alpha-range::-moz-range-thumb{ width:16px; height:16px; border-radius:4px; background:#ffffff; border:2px solid #374151; }`}</style>
                          <input
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.05"
                            value={gridSettings.opacity}
                            onChange={(e) => { snapshotSettings(); setGridSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) })); }}
                            className="alpha-range"
                            aria-label="Opacity"
                          />
                        </div>
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
              {!panToolActive && !zoomToolActive && assetGroup !== 'token' && engine === "canvas" && interactionMode !== 'select' && (
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

        {/* CENTERED DRAW AREA */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="w-full h-full overflow-auto overflow-x-hidden"
            style={{
              backgroundImage:
                "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              backgroundPosition: "50% 0, 2px 0",
              backgroundRepeat: "no-repeat, repeat",
              backgroundColor: "#f4e4c1",
              paddingTop: layerBarHeight,
            }}
          >
            {/* Top layer bar placeholder for measurement only (no layout) */}
            <div ref={layerBarWrapRef} className="absolute opacity-0 pointer-events-none -z-10" style={{ top: -9999, left: -9999 }}>
              <LayerBar
                currentLayer={currentLayer}
                setCurrentLayer={setCurrentLayer}
                layerVisibility={layerVisibility}
                toggleLayerVisibility={toggleLayerVisibility}
              tokensVisible={tokensVisible}
              setTokensVisible={setTokensVisible}
              showGridLines={showGridLines}
              setShowGridLines={setShowGridLines}
              tileSize={tileSize}
              setTileSize={setTileSize}
            />
            </div>
            {/* Fixed LAYERS bar overlay aligned to the scroll container */}
            <div className="fixed z-[10020]" style={{ top: fixedBarTop, left: fixedBarLeft, width: fixedBarWidth }}>
              <LayerBar
                currentLayer={currentLayer}
                setCurrentLayer={setCurrentLayer}
                layerVisibility={layerVisibility}
                toggleLayerVisibility={toggleLayerVisibility}
                tokensVisible={tokensVisible}
                setTokensVisible={setTokensVisible}
                showGridLines={showGridLines}
                setShowGridLines={setShowGridLines}
                tileSize={tileSize}
                setTileSize={setTileSize}
              />
            </div>
            <div className="relative w-full min-h-full flex justify-center items-start md:items-center p-6">
              {/* Fixed overlays under LAYERS; do not affect layout; overlap grid */}
              <div className="fixed z-[10015] pointer-events-auto" style={{ top: overlayTop, left: overlayLeft }}>
                <VerticalToolStrip
                  interactionMode={interactionMode}
                  zoomToolActive={zoomToolActive}
                  panToolActive={panToolActive}
                  setInteractionMode={setInteractionMode}
                  setZoomToolActive={setZoomToolActive}
                  setPanToolActive={setPanToolActive}
                  isErasing={isErasing}
                  setIsErasing={setIsErasing}
                  engine={engine}
                  setEngine={setEngine}
                  assetGroup={assetGroup}
                  canActOnSelection={(selectedObjsList?.length || 0) > 0 || (selectedTokensList?.length || 0) > 0}
                  onSaveSelection={() => setSaveDialogOpen(true)}
                  onDeleteSelection={deleteCurrentSelection}
                />
              </div>
              <div className="fixed z-[10015] pointer-events-auto" style={{ top: overlayTop, left: overlayCenter, transform: 'translateX(-50%)' }}>
                <div className="inline-flex items-center gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
                  <button
                    onClick={undo}
                    disabled={!undoStack.length}
                    aria-label="Undo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${undoStack.length ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M6 5H3.5L6.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.5 5c2.5-2.2 6.2-2 8.5.3 2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={redo}
                    disabled={!redoStack.length}
                    aria-label="Redo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${redoStack.length ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M10 5h2.5L9.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12.5 5c-2.5-2.2-6.2-2-8.5.3-2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <Grid
                maps={maps}
                objects={objects}
                tokens={tokens}
                assets={assets}
                engine={engine}
                selectedAsset={selectedAsset}
                gridSettings={gridSettings}
                stampSettings={assetStamp}
                setGridSettings={setGridSettings}
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
                panToolActive={panToolActive}
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

      {/* MAP SIZE MODAL */}
      {mapSizeModalOpen && (
        <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60">
          <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
            <div className="font-semibold mb-2">Map Size</div>
            <div className="grid grid-cols-2 gap-3 mb-3 items-end">
              <label className="text-xs">Rows
                <input
                  type="number"
                  value={rowsInput}
                  min={1}
                  max={200}
                  step={1}
                  onChange={(e)=> setRowsInput(e.target.value)}
                  className="box-border w-full px-1 py-0.5 text-xs text-black rounded"
                />
              </label>
              <label className="text-xs">Cols
                <input
                  type="number"
                  value={colsInput}
                  min={1}
                  max={200}
                  step={1}
                  onChange={(e)=> setColsInput(e.target.value)}
                  className="box-border w-full px-1 py-0.5 text-xs text-black rounded"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={()=> setMapSizeModalOpen(false)}>Cancel</button>
              <button
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
                onClick={() => { updateGridSizes(); setMapSizeModalOpen(false); }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Assets drawer overlay (resizable, overlaps content) */}
      <BottomAssetsDrawer
        assetPanelProps={{
          assetGroup,
          setAssetGroup,
          showAssetKindMenu,
          setShowAssetKindMenu,
          showAssetPreviews,
          setShowAssetPreviews,
          assets,
          selectedAssetId,
          selectedAsset,
          selectAsset,
          tokens,
          objects,
          creatorOpen,
          creatorKind,
          editingAsset,
          openCreator,
          setCreatorOpen,
          setEditingAsset,
          handleCreatorCreate,
          updateAssetById,
          setAssets,
          setSelectedAssetId,
          alertFn: (msg) => showToast(msg, 'warning', 3500),
          confirmFn: (msg) => confirmUser(msg),
        }}
        initialHeight={90}
        minHeight={0}
        maxHeightPct={0.7}
        assetStamp={assetStamp}
        setAssetStamp={setAssetStamp}
        naturalSettings={naturalSettings}
        setNaturalSettings={setNaturalSettings}
      />

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






































