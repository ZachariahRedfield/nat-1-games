import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  saveProject as saveProjectManager,
  saveProjectAs as saveProjectAsManager,
  loadProjectFromDirectory,
  listMaps,
  deleteMap,
  loadAssetsFromStoredParent,
  isAssetsFolderConfigured,
  hasCurrentProjectDir,
} from "../../../../application/save-load/index.js";
import { useLegacySceneState } from "../../modules/editor/useLegacySceneState.js";
import { useOverlayLayout } from "../../modules/layout/useOverlayLayout.js";
import { useZoomControls } from "../../modules/interaction/useZoomControls.js";
import { useFeedbackState } from "../../modules/feedback/useFeedbackState.js";
import { useLegacyProjectSaving } from "../../modules/save-load/useLegacyProjectSaving.js";
import { useLegacyProjectLoading } from "../../modules/save-load/useLegacyProjectLoading.js";
import { useGridSelectionState } from "../state/useGridSelectionState.js";
import { useTokenSelectionState } from "../state/useTokenSelectionState.js";
import { useLayerVisibilityState } from "../state/useLayerVisibilityState.js";
import { useLegacyAssetWorkflow } from "../state/useLegacyAssetWorkflow.js";
import { useLegacyHistory } from "../state/useLegacyHistory.js";

function useLayerAndInteractionState() {
  const [currentLayer, setCurrentLayer] = useState("base");
  const [interactionMode, setInteractionMode] = useState("draw");
  const [isErasing, setIsErasing] = useState(false);
  const [canvasColor, setCanvasColor] = useState(null);

  return {
    currentLayer,
    setCurrentLayer,
    interactionMode,
    setInteractionMode,
    isErasing,
    setIsErasing,
    canvasColor,
    setCanvasColor,
  };
}

function useGridSettingsState() {
  const [gridSettings, setGridSettings] = useState({
    sizeTiles: 1,
    sizeCols: 1,
    sizeRows: 1,
    linkXY: false,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true,
    snapStep: 1,
    smartAdjacency: true,
  });

  return { gridSettings, setGridSettings };
}

function useCanvasRefs() {
  const backgroundCanvasRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const skyCanvasRef = useRef(null);

  const canvasRefs = useMemo(
    () => ({
      background: backgroundCanvasRef,
      base: baseCanvasRef,
      sky: skyCanvasRef,
    }),
    [backgroundCanvasRef, baseCanvasRef, skyCanvasRef]
  );

  return {
    backgroundCanvasRef,
    baseCanvasRef,
    skyCanvasRef,
    canvasRefs,
  };
}

function useLayoutRefs() {
  const scrollRef = useRef(null);
  const gridContentRef = useRef(null);
  const layerBarWrapRef = useRef(null);

  return { scrollRef, gridContentRef, layerBarWrapRef };
}

function useTileState() {
  const [tileSize, setTileSize] = useState(24);
  return { tileSize, setTileSize };
}

function useUndoRedoState() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  return { undoStack, setUndoStack, redoStack, setRedoStack };
}

function useMenuState() {
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);
  const toggleMapsMenu = useCallback(() => {
    setMapsMenuOpen((value) => !value);
  }, []);

  return { mapsMenuOpen, toggleMapsMenu, setMapsMenuOpen };
}

function useMapSizeDialogState() {
  const [mapSizeModalOpen, setMapSizeModalOpen] = useState(false);
  const openMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(true);
  }, []);
  const closeMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(false);
  }, []);

  return {
    mapSizeModalOpen,
    openMapSizeModal,
    closeMapSizeModal,
    setMapSizeModalOpen,
  };
}

function useSaveSelectionDialogState() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const openSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);
  const closeSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  return {
    saveDialogOpen,
    openSaveSelectionDialog,
    closeSaveSelectionDialog,
  };
}

function useGridDimensionsInputs({ setRowsInput, setColsInput }) {
  const handleChangeRows = useCallback(
    (event) => {
      setRowsInput(event.target.value);
    },
    [setRowsInput]
  );

  const handleChangeCols = useCallback(
    (event) => {
      setColsInput(event.target.value);
    },
    [setColsInput]
  );

  return { handleChangeRows, handleChangeCols };
}

function useZoomToRect({
  clamp,
  snap,
  tileSize,
  rows,
  cols,
  scrollRef,
  gridContentRef,
  setTileSize,
  setUndoStack,
  setRedoStack,
}) {
  return useCallback(
    ({ left, top, width, height }) => {
      const container = scrollRef.current;
      const content = gridContentRef.current;
      if (!container || !content) return;
      setUndoStack((prev) => [
        ...prev,
        { type: "view", tileSize, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop },
      ]);
      setRedoStack([]);

      const prevTileSize = tileSize;
      if (width < 8 || height < 8) return;

      const scaleX = container.clientWidth / width;
      const scaleY = container.clientHeight / height;
      let next = clamp(snap(prevTileSize * Math.min(scaleX, scaleY), 4), 8, 128);
      if (next <= prevTileSize) {
        next = clamp(prevTileSize + 8, 8, 128);
      }

      const contentWidthPrev = cols * prevTileSize;
      const contentHeightPrev = rows * prevTileSize;
      let rx = (left + width / 2) / (contentWidthPrev || 1);
      let ry = (top + height / 2) / (contentHeightPrev || 1);
      rx = clamp(rx, 0, 1);
      ry = clamp(ry, 0, 1);

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
        const minLeft = Math.max(0, contentOffsetLeft);
        const minTop = Math.max(0, contentOffsetTop);
        const maxLeft = Math.max(minLeft, contentOffsetLeft + contentWidthNext - container.clientWidth);
        const maxTop = Math.max(minTop, contentOffsetTop + contentHeightNext - container.clientHeight);
        container.scrollTo({
          left: clamp(desiredLeft, minLeft, maxLeft),
          top: clamp(desiredTop, minTop, maxTop),
        });
      };
      requestAnimationFrame(() => requestAnimationFrame(centerAfterPaint));
    },
    [clamp, cols, gridContentRef, rows, scrollRef, setRedoStack, setTileSize, setUndoStack, snap, tileSize]
  );
}

function useKeyboardShortcuts({ setZoomToolActive }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Escape") {
        setZoomToolActive(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setZoomToolActive]);
}

export function useLegacyMapBuilderState() {
  const projectNameRef = useRef("My Map");

  const layerState = useLayerAndInteractionState();
  const sceneState = useLegacySceneState({
    getCurrentLayer: useCallback(() => layerState.currentLayer, [layerState.currentLayer]),
    getIsErasing: useCallback(() => layerState.isErasing, [layerState.isErasing]),
    getCanvasColor: useCallback(() => layerState.canvasColor, [layerState.canvasColor]),
  });

  const gridSettingsState = useGridSettingsState();

  const gridSelectionState = useGridSelectionState({
    gridSettings: gridSettingsState.gridSettings,
    setGridSettings: gridSettingsState.setGridSettings,
  });

  const tokenSelectionState = useTokenSelectionState({
    setGridSettings: gridSettingsState.setGridSettings,
  });

  const saveSelectionDialogState = useSaveSelectionDialogState();
  const menuState = useMenuState();
  const mapSizeDialogState = useMapSizeDialogState();
  const canvasRefsState = useCanvasRefs();
  const layoutRefs = useLayoutRefs();
  const tileState = useTileState();
  const undoRedoState = useUndoRedoState();

  const feedbackState = useFeedbackState();
  const promptUser = feedbackState.requestPrompt;
  const confirmUser = feedbackState.requestConfirm;

  const layoutState = useOverlayLayout({
    scrollRef: layoutRefs.scrollRef,
    layerBarWrapRef: layoutRefs.layerBarWrapRef,
    tileSize: tileState.tileSize,
    rows: sceneState.rows,
    cols: sceneState.cols,
    menuOpen: menuState.mapsMenuOpen,
  });

  const zoomState = useZoomControls({ setTileSize: tileState.setTileSize });

  const layerVisibilityState = useLayerVisibilityState();
  const [showGridLines, setShowGridLines] = useState(true);
  const [engine, setEngine] = useState("grid");

  const clamp = useCallback((value, min, max) => Math.max(min, Math.min(max, value)), []);
  const snap = useCallback((value, step = 4) => Math.round(value / step) * step, []);

  const handleZoomToRect = useZoomToRect({
    clamp,
    snap,
    tileSize: tileState.tileSize,
    rows: sceneState.rows,
    cols: sceneState.cols,
    scrollRef: layoutRefs.scrollRef,
    gridContentRef: layoutRefs.gridContentRef,
    setTileSize: tileState.setTileSize,
    setUndoStack: undoRedoState.setUndoStack,
    setRedoStack: undoRedoState.setRedoStack,
  });

  useKeyboardShortcuts({ setZoomToolActive: zoomState.setZoomToolActive });

  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [canvasSpacing, setCanvasSpacing] = useState(0);
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(true);
  const [naturalSettings, setNaturalSettings] = useState(null);

  const snapshotSettings = useCallback(() => {}, []);

  const legacyAssetWorkflow = useLegacyAssetWorkflow({
    hasSelection: gridSelectionState.hasSelection,
    selectedObj: gridSelectionState.selectedObj,
    selectedObjsList: gridSelectionState.selectedObjsList,
    clearObjectSelection: gridSelectionState.clearObjectSelection,
    selectedToken: tokenSelectionState.selectedToken,
    selectedTokensList: tokenSelectionState.selectedTokensList,
    clearTokenSelection: tokenSelectionState.clearTokenSelection,
    showToast: feedbackState.showToast,
    promptUser,
    confirmUser,
    updateObjectById: sceneState.updateObjectById,
    updateTokenById: tokenSelectionState.updateTokenById,
    maps: sceneState.maps,
    setMaps: sceneState.setMaps,
    objects: sceneState.objects,
    setObjects: sceneState.setObjects,
    tokens: tokenSelectionState.tokens,
    setTokens: tokenSelectionState.setTokens,
    gridSettings: gridSettingsState.gridSettings,
    setGridSettings: gridSettingsState.setGridSettings,
    tileSize: tileState.tileSize,
    setTileSize: tileState.setTileSize,
    engine,
    setEngine,
    interactionMode: layerState.interactionMode,
    setInteractionMode: layerState.setInteractionMode,
    setZoomToolActive: zoomState.setZoomToolActive,
    setPanToolActive: zoomState.setPanToolActive,
    setCanvasColor: layerState.setCanvasColor,
    canvasRefs: canvasRefsState.canvasRefs,
    canvasColor: layerState.canvasColor,
    placeTiles: sceneState.placeTiles,
    addObject: sceneState.addObject,
    eraseObjectAt: sceneState.eraseObjectAt,
    moveObject: sceneState.moveObject,
    removeObjectById: sceneState.removeObjectById,
    removeTokenById: tokenSelectionState.removeTokenById,
    addToken: tokenSelectionState.addToken,
    moveToken: tokenSelectionState.moveToken,
    projectName: () => projectNameRef.current,
  });

  const { setCreatorOpen, setEditingAsset, editingAsset, updateAssetById } = legacyAssetWorkflow;

  const closeAssetCreator = useCallback(() => {
    setCreatorOpen(false);
    setEditingAsset(null);
  }, [setCreatorOpen, setEditingAsset]);

  const handleAssetUpdate = useCallback(
    (updated) => {
      if (!editingAsset) return;
      updateAssetById(editingAsset.id, updated);
    },
    [editingAsset, updateAssetById]
  );

  const historyState = useLegacyHistory({
    undoStack: undoRedoState.undoStack,
    setUndoStack: undoRedoState.setUndoStack,
    redoStack: undoRedoState.redoStack,
    setRedoStack: undoRedoState.setRedoStack,
    maps: sceneState.maps,
    setMaps: sceneState.setMaps,
    objects: sceneState.objects,
    setObjects: sceneState.setObjects,
    tokens: tokenSelectionState.tokens,
    setTokens: tokenSelectionState.setTokens,
    assets: legacyAssetWorkflow.assets,
    setAssets: legacyAssetWorkflow.setAssets,
    gridSettings: gridSettingsState.gridSettings,
    setGridSettings: gridSettingsState.setGridSettings,
    brushSize: legacyAssetWorkflow.brushSize,
    setBrushSize: legacyAssetWorkflow.setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    naturalSettings,
    setNaturalSettings,
    tileSize: tileState.tileSize,
    setTileSize: tileState.setTileSize,
    scrollRef: layoutRefs.scrollRef,
    canvasRefs: canvasRefsState.canvasRefs,
    currentLayer: layerState.currentLayer,
    showToast: feedbackState.showToast,
    selectedObjsList: gridSelectionState.selectedObjsList,
    selectedTokensList: tokenSelectionState.selectedTokensList,
    removeObjectById: sceneState.removeObjectById,
    removeTokenById: tokenSelectionState.removeTokenById,
    clearObjectSelection: gridSelectionState.clearObjectSelection,
    clearTokenSelection: tokenSelectionState.clearTokenSelection,
  });

  const projectLoadingState = useLegacyProjectLoading({
    isAssetsFolderConfigured,
    setNeedsAssetsFolder: legacyAssetWorkflow.setNeedsAssetsFolder,
    showToast: feedbackState.showToast,
    listMaps,
    loadProjectFromDirectory,
    setRowsInput: sceneState.setRowsInput,
    setColsInput: sceneState.setColsInput,
    setMaps: sceneState.setMaps,
    setObjects: sceneState.setObjects,
    setTokens: tokenSelectionState.setTokens,
    setAssets: legacyAssetWorkflow.setAssets,
    setSelectedAssetId: legacyAssetWorkflow.setSelectedAssetId,
    projectNameRef,
    canvasRefs: canvasRefsState.canvasRefs,
    confirmUser,
    deleteMap,
  });

  const projectSavingState = useLegacyProjectSaving({
    isAssetsFolderConfigured,
    showToast: feedbackState.showToast,
    setNeedsAssetsFolder: legacyAssetWorkflow.setNeedsAssetsFolder,
    hasCurrentProjectDir,
    promptUser,
    saveProjectManager,
    saveProjectAsManager,
    loadAssetsFromStoredParent,
    setAssets: legacyAssetWorkflow.setAssets,
    setSelectedAssetId: legacyAssetWorkflow.setSelectedAssetId,
    setUndoStack: undoRedoState.setUndoStack,
    setRedoStack: undoRedoState.setRedoStack,
    projectNameRef,
    canvasRefs: canvasRefsState.canvasRefs,
    rows: sceneState.rows,
    cols: sceneState.cols,
    tileSize: tileState.tileSize,
    maps: sceneState.maps,
    objects: sceneState.objects,
    tokens: tokenSelectionState.tokens,
    assets: legacyAssetWorkflow.assets,
    currentLayer: layerState.currentLayer,
    brushSize: legacyAssetWorkflow.brushSize,
    gridSettings: gridSettingsState.gridSettings,
    engine,
    layerVisibility: layerVisibilityState.layerVisibility,
    tokensVisible: tokenSelectionState.tokensVisible,
    tokenHUDVisible: tokenSelectionState.tokenHUDVisible,
    tokenHUDShowInitiative: tokenSelectionState.tokenHUDShowInitiative,
    assetGroup: legacyAssetWorkflow.assetGroup,
    showGridLines,
    canvasOpacity,
    canvasSpacing,
    canvasBlendMode,
    canvasSmoothing,
    naturalSettings,
  });

  const { handleChangeRows, handleChangeCols } = useGridDimensionsInputs({
    setRowsInput: sceneState.setRowsInput,
    setColsInput: sceneState.setColsInput,
  });

  const applyMapSize = useCallback(() => {
    sceneState.updateGridSizes();
    mapSizeDialogState.setMapSizeModalOpen(false);
  }, [mapSizeDialogState, sceneState]);

  return {
    projectNameRef,
    ...layerState,
    ...sceneState,
    ...gridSettingsState,
    ...gridSelectionState,
    ...tokenSelectionState,
    ...saveSelectionDialogState,
    ...menuState,
    ...mapSizeDialogState,
    ...canvasRefsState,
    ...layoutRefs,
    ...tileState,
    ...undoRedoState,
    ...feedbackState,
    promptUser,
    confirmUser,
    ...layoutState,
    ...zoomState,
    ...layerVisibilityState,
    showGridLines,
    setShowGridLines,
    engine,
    setEngine,
    clamp,
    snap,
    handleZoomToRect,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    naturalSettings,
    setNaturalSettings,
    snapshotSettings,
    ...legacyAssetWorkflow,
    closeAssetCreator,
    handleAssetUpdate,
    ...historyState,
    ...projectLoadingState,
    ...projectSavingState,
    handleChangeRows,
    handleChangeCols,
    applyMapSize,
  };
}

export default useLegacyMapBuilderState;
