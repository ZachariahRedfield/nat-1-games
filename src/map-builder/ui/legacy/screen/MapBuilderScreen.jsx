import React, { useCallback, useEffect, useRef, useState } from "react";
import Grid from "../../canvas/Grid/Grid.jsx";
import {
  saveProject as saveProjectManager,
  saveProjectAs as saveProjectAsManager,
  loadProject as loadProjectManager,
  loadProjectFromDirectory,
  listMaps,
  deleteMap,
  loadAssetsFromStoredParent,
  isAssetsFolderConfigured,
  hasCurrentProjectDir,
  clearCurrentProjectDir,
} from "../../../application/save-load/index.js";

import { LAYERS, deepCopyGrid, deepCopyObjects } from "../utils.js";
import { useLegacySceneState } from "../modules/editor/useLegacySceneState.js";
import { SiteHeader } from "../../../../shared/index.js";
import SaveSelectionDialog from "../SaveSelectionDialog.jsx";
import Header from "../Header.jsx";
import LayerBar from "../LayerBar.jsx";
import BottomAssetsDrawer from "../BottomAssetsDrawer.jsx";
import VerticalToolStrip from "../VerticalToolStrip.jsx";
import { useOverlayLayout } from "../modules/layout/useOverlayLayout.js";
import { useZoomControls } from "../modules/interaction/useZoomControls.js";
import FeedbackLayer from "../modules/feedback/FeedbackLayer.jsx";
import { useFeedbackState } from "../modules/feedback/useFeedbackState.js";
import { useAssetLibrary } from "../modules/assets/useAssetLibrary.js";
import { useAssetExports } from "../modules/assets/useAssetExports.js";
import { useLegacyProjectSaving } from "../modules/save-load/useLegacyProjectSaving.js";
import { useLegacyProjectLoading } from "../modules/save-load/useLegacyProjectLoading.js";
import { useTokenState } from "../modules/tokens/index.js";
import {
  BrushIcon,
  CanvasIcon,
  CursorIcon,
  EraserIcon,
  GridIcon,
  PanIcon,
  SaveIcon,
  ZoomIcon,
} from "./components/ToolIcons.jsx";
import AssetCreatorModal from "./components/AssetCreatorModal.jsx";
import LoadMapsModal from "./components/LoadMapsModal.jsx";
import MapSizeModal from "./components/MapSizeModal.jsx";
import AssetsFolderBanner from "./components/AssetsFolderBanner.jsx";
import LegacySettingsPanel from "./components/LegacySettingsPanel.jsx";

export default function MapBuilder({ goBack, session, onLogout, onNavigate, currentScreen }) {
  // --- layers ---
  const [currentLayer, setCurrentLayer] = useState("base");

  // Edit mode: 'draw' | 'select'
  const [interactionMode, setInteractionMode] = useState("draw");

  const [isErasing, setIsErasing] = useState(false);
  const [canvasColor, setCanvasColor] = useState(null);

  const {
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    rows,
    cols,
    maps,
    setMaps,
    objects,
    setObjects,
    updateGridSizes,
    placeTiles,
    addObject,
    eraseObjectAt,
    moveObject,
    updateObjectById,
    removeObjectById,
  } = useLegacySceneState({
    getCurrentLayer: useCallback(() => currentLayer, [currentLayer]),
    getIsErasing: useCallback(() => isErasing, [isErasing]),
    getCanvasColor: useCallback(() => canvasColor, [canvasColor]),
  });

  // Remember user's own grid controls to restore after selection
  const gridDefaultsRef = useRef(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedObjsList, setSelectedObjsList] = useState([]);

  // --- tokens (characters / interactables) ---
  // token: { id, assetId, row, col, wTiles, hTiles, rotation, opacity, meta?:{ name, hp, initiative } }
  const {
    tokens,
    setTokens,
    tokensVisible,
    setTokensVisible,
    selectedToken,
    setSelectedToken,
    selectedTokensList,
    setSelectedTokensList,
    tokenHUDVisible,
    setTokenHUDVisible,
    tokenHUDShowInitiative,
    setTokenHUDShowInitiative,
    addToken,
    moveToken,
    updateTokenById,
    removeTokenById,
  } = useTokenState();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Toggle showing words under Save/Save As/Load in header center
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);
  const {
    toasts,
    showToast,
    promptState,
    promptInputRef,
    requestPrompt,
    submitPrompt,
    cancelPrompt,
    confirmState,
    requestConfirm,
    approveConfirm,
    cancelConfirm,
  } = useFeedbackState();

  const promptUser = requestPrompt;
  const confirmUser = requestConfirm;

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

  const {
    layerBarHeight,
    overlayPosition: { top: overlayTop, left: overlayLeft, center: overlayCenter },
    fixedLayerBar: { top: fixedBarTop, left: fixedBarLeft, width: fixedBarWidth },
  } = useOverlayLayout({
    scrollRef,
    layerBarWrapRef,
    tileSize,
    rows,
    cols,
    menuOpen: mapsMenuOpen,
  });

  const {
    zoomToolActive,
    setZoomToolActive,
    panToolActive,
    setPanToolActive,
    zoomScrubRef,
    zoomScrubPos,
    handleZoomScrubStart,
  } = useZoomControls({ setTileSize });

  const [layerVisibility, setLayerVisibility] = useState({
    background: true,
    base: true,
    sky: true, // sky visible by default
  });
  // Visual grid line toggle
  const [showGridLines, setShowGridLines] = useState(true);

  const [engine, setEngine] = useState("grid");
  const {
    assets,
    setAssets,
    getAsset,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    selectAsset,
    assetGroup,
    setAssetGroup,
    showAssetKindMenu,
    setShowAssetKindMenu,
    showAssetPreviews,
    setShowAssetPreviews,
    creatorOpen,
    setCreatorOpen,
    creatorKind,
    setCreatorKind,
    editingAsset,
    setEditingAsset,
    openCreator,
    openEditAsset,
    handleCreatorCreate,
    addColorMode,
    setAddColorMode,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    newLabelText,
    setNewLabelText,
    newLabelColor,
    setNewLabelColor,
    newLabelSize,
    setNewLabelSize,
    newLabelFont,
    setNewLabelFont,
    flowHue,
    setFlowHue,
    flowSat,
    setFlowSat,
    flowLight,
    setFlowLight,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
    updateAssetById,
    mapAssetToCreatorKind,
    handleUpload,
    handleCreateNatural,
    createTextLabelAsset,
    needsAssetsFolder,
    setNeedsAssetsFolder,
    promptChooseAssetsFolder,
    normalizeStamp,
    normalizeNaturalSettings,
  } = useAssetLibrary({
    setEngine,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
  });

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
    setNaturalSettings((cur) => ({ ...cur, ...normalizeNaturalSettings(d) }));
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
  // Canvas engine (free brush)
  const [brushSize, setBrushSize] = useState(2); // in tiles
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27); // fraction of radius
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(0.55); // EMA smoothing factor (0..1)
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
    const next = normalizeNaturalSettings(naturalSettings);
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

  // ====== Load Maps Modal ======
  // --- undo/redo ---
  // entries: { type:'tilemap'|'canvas'|'objects', layer, map? snapshot? objects? }
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

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

  const {
    regenerateLabelInstance,
    saveSelectionAsAsset,
    saveSelectedTokenAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokensAsGroup,
    saveCurrentSelection,
  } = useAssetExports({
    assets,
    setAssets,
    setSelectedAssetId,
    setAssetGroup,
    setEngine,
    selectedObj,
    selectedObjsList,
    selectedToken,
    selectedTokensList,
    updateObjectById,
    currentLayer,
    tileSize,
    promptUser,
    confirmUser,
    showToast,
    setUndoStack,
    setRedoStack,
    objects,
  });

  // No-op: Do not track settings changes in undo/redo
  const snapshotSettings = () => {};

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

  const {
    loadModalOpen,
    mapsList,
    openLoadModal,
    closeLoadModal,
    handleLoadMapFromList,
    handleDeleteMapFromList,
  } = useLegacyProjectLoading({
    isAssetsFolderConfigured,
    setNeedsAssetsFolder,
    showToast,
    listMaps,
    loadProjectFromDirectory,
    setRowsInput,
    setColsInput,
    setMaps,
    setObjects,
    setTokens,
    setAssets,
    setSelectedAssetId,
    projectNameRef,
    canvasRefs,
    confirmUser,
    deleteMap,
  });

  const { saveProject, saveProjectAs } = useLegacyProjectSaving({
    isAssetsFolderConfigured,
    showToast,
    setNeedsAssetsFolder,
    hasCurrentProjectDir,
    promptUser,
    saveProjectManager,
    saveProjectAsManager,
    loadAssetsFromStoredParent,
    setAssets,
    setSelectedAssetId,
    setUndoStack,
    setRedoStack,
    projectNameRef,
    canvasRefs,
    rows,
    cols,
    tileSize,
    maps,
    objects,
    tokens,
    assets,
    currentLayer,
    brushSize,
    gridSettings,
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
    naturalSettings,
  });

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


      <AssetsFolderBanner
        needsAssetsFolder={needsAssetsFolder}
        onChooseFolder={promptChooseAssetsFolder}
      />

      <main className="flex flex-1 overflow-hidden min-h-0">
        <FeedbackLayer
          toasts={toasts}
          promptState={promptState}
          confirmState={confirmState}
          promptInputRef={promptInputRef}
          onPromptSubmit={submitPrompt}
          onPromptCancel={cancelPrompt}
          onConfirmApprove={approveConfirm}
          onConfirmCancel={cancelConfirm}
        />

        <AssetCreatorModal
          open={creatorOpen}
          editingAsset={editingAsset}
          creatorKind={creatorKind}
          selectedAsset={selectedAsset}
          onClose={() => {
            setCreatorOpen(false);
            setEditingAsset(null);
          }}
          onCreate={handleCreatorCreate}
          onUpdate={(updated) => {
            if (!editingAsset) return;
            updateAssetById(editingAsset.id, updated);
          }}
        />

        <LoadMapsModal
          open={loadModalOpen}
          mapsList={mapsList}
          onClose={closeLoadModal}
          onOpenMap={handleLoadMapFromList}
          onDeleteMap={handleDeleteMapFromList}
        />
        <LegacySettingsPanel
          panToolActive={panToolActive}
          zoomToolActive={zoomToolActive}
          engine={engine}
          interactionMode={interactionMode}
          assetGroup={assetGroup}
          selectedAsset={selectedAsset}
          currentLayer={currentLayer}
          layerVisibility={layerVisibility}
          selectedObj={selectedObj}
          selectedObjsList={selectedObjsList}
          selectedToken={selectedToken}
          selectedTokensList={selectedTokensList}
          assets={assets}
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
          regenerateLabelInstance={regenerateLabelInstance}
          updateTokenById={updateTokenById}
          tokenHUDVisible={tokenHUDVisible}
          setTokenHUDVisible={setTokenHUDVisible}
          tokenHUDShowInitiative={tokenHUDShowInitiative}
          setTokenHUDShowInitiative={setTokenHUDShowInitiative}
        />

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
      <MapSizeModal
        open={mapSizeModalOpen}
        rowsValue={rowsInput}
        colsValue={colsInput}
        onChangeRows={(event) => setRowsInput(event.target.value)}
        onChangeCols={(event) => setColsInput(event.target.value)}
        onCancel={() => setMapSizeModalOpen(false)}
        onApply={() => {
          updateGridSizes();
          setMapSizeModalOpen(false);
        }}
      />

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






































