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
} from "../../../application/save-load/index.js";
import { useLegacySceneState } from "../modules/editor/useLegacySceneState.js";
import { useOverlayLayout } from "../modules/layout/useOverlayLayout.js";
import { useZoomControls } from "../modules/interaction/useZoomControls.js";
import { useFeedbackState } from "../modules/feedback/useFeedbackState.js";
import { useLegacyProjectSaving } from "../modules/save-load/useLegacyProjectSaving.js";
import { useLegacyProjectLoading } from "../modules/save-load/useLegacyProjectLoading.js";
import { useGridSelectionState } from "./state/useGridSelectionState.js";
import { useTokenSelectionState } from "./state/useTokenSelectionState.js";
import { useLayerVisibilityState } from "./state/useLayerVisibilityState.js";
import { useLegacyAssetWorkflow } from "./state/useLegacyAssetWorkflow.js";
import { useLegacyHistory } from "./state/useLegacyHistory.js";

export function useLegacyMapBuilderController() {
  const [currentLayer, setCurrentLayer] = useState("base");
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

  const {
    hasSelection,
    selectedObj,
    selectedObjsList,
    handleSelectionChange,
    clearObjectSelection,
  } = useGridSelectionState({ gridSettings, setGridSettings });

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
    handleTokenSelectionChange,
    clearTokenSelection,
  } = useTokenSelectionState({ setGridSettings });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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

  const [mapSizeModalOpen, setMapSizeModalOpen] = useState(false);

  const canvasRefs = useMemo(
    () => ({
      background: useRef(null),
      base: useRef(null),
      sky: useRef(null),
    }),
    []
  );

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

  const { layerVisibility, toggleLayerVisibility, showAllLayers, hideAllLayers } =
    useLayerVisibilityState();
  const [showGridLines, setShowGridLines] = useState(true);

  const [engine, setEngine] = useState("grid");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const clamp = useCallback((value, min, max) => Math.max(min, Math.min(max, value)), []);
  const snap = useCallback((value, step = 4) => Math.round(value / step) * step, []);

  const handleZoomToRect = useCallback(
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
    [clamp, cols, gridContentRef, rows, scrollRef, snap, tileSize]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Escape") {
        setZoomToolActive(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setZoomToolActive]);

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
    brushSize,
    setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    regenerateLabelInstance,
    saveSelectionAsAsset,
    saveSelectedTokenAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokensAsGroup,
    saveCurrentSelection,
  } = useLegacyAssetWorkflow({
    hasSelection,
    selectedObj,
    selectedObjsList,
    clearObjectSelection,
    selectedToken,
    selectedTokensList,
    clearTokenSelection,
    showToast,
    promptUser,
    confirmUser,
    updateObjectById,
    updateTokenById,
    maps,
    setMaps,
    objects,
    setObjects,
    tokens,
    setTokens,
    gridSettings,
    setGridSettings,
    tileSize,
    setTileSize,
    engine,
    setEngine,
    interactionMode,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
    canvasRefs,
    canvasColor,
    placeTiles,
    addObject,
    eraseObjectAt,
    moveObject,
    removeObjectById,
    removeTokenById,
    addToken,
    moveToken,
    projectName: () => projectNameRef.current,
  });

  const {
    onBeginTileStroke,
    onBeginCanvasStroke,
    onBeginObjectStroke,
    onBeginTokenStroke,
    deleteCurrentSelection,
    undo,
    redo,
  } = useLegacyHistory({
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    maps,
    setMaps,
    objects,
    setObjects,
    tokens,
    setTokens,
    assets,
    setAssets,
    gridSettings,
    setGridSettings,
    brushSize,
    setBrushSize,
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
    tileSize,
    setTileSize,
    scrollRef,
    canvasRefs,
    currentLayer,
    showToast,
    selectedObjsList,
    selectedTokensList,
    removeObjectById,
    removeTokenById,
    clearObjectSelection,
    clearTokenSelection,
  });

  const snapshotSettings = useCallback(() => {}, []);

  const projectNameRef = useRef("My Map");

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

  const toggleMapsMenu = useCallback(() => {
    setMapsMenuOpen((value) => !value);
  }, []);

  const openMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(true);
  }, []);

  const closeMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(false);
  }, []);

  const applyMapSize = useCallback(() => {
    updateGridSizes();
    setMapSizeModalOpen(false);
  }, [updateGridSizes]);

  const handleChangeRows = useCallback((event) => {
    setRowsInput(event.target.value);
  }, [setRowsInput]);

  const handleChangeCols = useCallback((event) => {
    setColsInput(event.target.value);
  }, [setColsInput]);

  const openSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const closeSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  const headerProps = {
    onUndo: undo,
    onRedo: redo,
    onSave: saveProject,
    onSaveAs: saveProjectAs,
    onLoad: openLoadModal,
    showSaveWords: mapsMenuOpen,
    mapsMenuOpen,
    onToggleMaps: toggleMapsMenu,
    onOpenMapSize: openMapSizeModal,
  };

  const assetsFolderBannerProps = {
    needsAssetsFolder,
    onChooseFolder: promptChooseAssetsFolder,
  };

  const feedbackLayerProps = {
    toasts,
    promptState,
    confirmState,
    promptInputRef,
    onPromptSubmit: submitPrompt,
    onPromptCancel: cancelPrompt,
    onConfirmApprove: approveConfirm,
    onConfirmCancel: cancelConfirm,
  };

  const assetCreatorModalProps = {
    open: creatorOpen,
    editingAsset,
    creatorKind,
    selectedAsset,
    onClose: closeAssetCreator,
    onCreate: handleCreatorCreate,
    onUpdate: handleAssetUpdate,
  };

  const loadMapsModalProps = {
    open: loadModalOpen,
    mapsList,
    onClose: closeLoadModal,
    onOpenMap: handleLoadMapFromList,
    onDeleteMap: handleDeleteMapFromList,
  };

  const legacySettingsPanelProps = {
    panToolActive,
    zoomToolActive,
    engine,
    interactionMode,
    assetGroup,
    selectedAsset,
    currentLayer,
    layerVisibility,
    selectedObj,
    selectedObjsList,
    selectedToken,
    selectedTokensList,
    assets,
    gridSettings,
    setGridSettings,
    naturalSettings,
    setNaturalSettings,
    brushSize,
    setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    tileSize,
    snapshotSettings,
    regenerateLabelInstance,
    updateTokenById,
    tokenHUDVisible,
    setTokenHUDVisible,
    tokenHUDShowInitiative,
    setTokenHUDShowInitiative,
  };

  const layerBarProps = {
    currentLayer,
    setCurrentLayer,
    layerVisibility,
    toggleLayerVisibility,
    tokensVisible,
    setTokensVisible,
    showGridLines,
    setShowGridLines,
    tileSize,
    setTileSize,
  };

  const toolbarProps = {
    interactionMode,
    zoomToolActive,
    panToolActive,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    isErasing,
    setIsErasing,
    engine,
    setEngine,
    assetGroup,
    canActOnSelection:
      (selectedObjsList?.length || 0) > 0 || (selectedTokensList?.length || 0) > 0,
    onSaveSelection: openSaveSelectionDialog,
    onDeleteSelection: deleteCurrentSelection,
  };

  const historyControls = {
    undo,
    redo,
    undoStack,
    redoStack,
  };

  const gridProps = {
    maps,
    objects,
    assets,
    engine,
    selectedAsset,
    gridSettings,
    stampSettings: assetStamp,
    setGridSettings,
    brushSize,
    canvasOpacity,
    canvasColor,
    canvasSpacing,
    canvasBlendMode,
    canvasSmoothing,
    naturalSettings,
    isErasing,
    interactionMode,
    tileSize,
    scrollRef,
    contentRef: gridContentRef,
    canvasRefs,
    currentLayer,
    layerVisibility,
    tokensVisible,
    tokenHUDVisible,
    tokenHUDShowInitiative,
    assetGroup,
    showGridLines,
    zoomToolActive,
    panToolActive,
    onZoomToolRect: handleZoomToRect,
    onBeginTileStroke,
    onBeginCanvasStroke,
    onBeginObjectStroke,
    onBeginTokenStroke,
    placeTiles,
    addObject,
    eraseObjectAt,
    moveObject,
    removeObjectById,
    updateObjectById,
    onSelectionChange: handleSelectionChange,
    tokens,
    addToken,
    moveToken,
    removeTokenById,
    updateTokenById,
    onTokenSelectionChange: handleTokenSelectionChange,
  };

  const mapSizeModalProps = {
    open: mapSizeModalOpen,
    rowsValue: rowsInput,
    colsValue: colsInput,
    onChangeRows: handleChangeRows,
    onChangeCols: handleChangeCols,
    onCancel: closeMapSizeModal,
    onApply: applyMapSize,
  };

  const bottomAssetsDrawerProps = {
    assetPanelProps: {
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
      alertFn: (message) => showToast(message, "warning", 3500),
      confirmFn: (message) => confirmUser(message),
    },
    initialHeight: 90,
    minHeight: 0,
    maxHeightPct: 0.7,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
  };

  const saveSelectionDialogProps = {
    open: saveDialogOpen,
    onClose: closeSaveSelectionDialog,
    selectedObjsList,
    selectedTokensList,
    saveSelectionAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokenAsAsset,
    saveSelectedTokensAsGroup,
  };

  return {
    headerProps,
    assetsFolderBannerProps,
    feedbackLayerProps,
    assetCreatorModalProps,
    loadMapsModalProps,
    legacySettingsPanelProps,
    layout: {
      scrollRef,
      gridContentRef,
      layerBarWrapRef,
      layerBarHeight,
      fixedBarTop,
      fixedBarLeft,
      fixedBarWidth,
      overlayTop,
      overlayLeft,
      overlayCenter,
    },
    layerBarProps,
    toolbarProps,
    historyControls,
    gridProps,
    mapSizeModalProps,
    bottomAssetsDrawerProps,
    saveSelectionDialogProps,
  };
}

export default useLegacyMapBuilderController;
