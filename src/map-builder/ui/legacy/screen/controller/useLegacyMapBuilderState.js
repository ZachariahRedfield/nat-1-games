import { useCallback, useRef, useState } from "react";
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
import { useCanvasDisplayState } from "./state/useCanvasDisplayState.js";
import { useCanvasRefs } from "./state/useCanvasRefs.js";
import { useClampAndSnap } from "./state/useClampSnap.js";
import { useGridDimensionsInputs } from "./state/useGridDimensionsInputs.js";
import { useGridSettingsState } from "./state/useGridSettingsState.js";
import { useKeyboardShortcuts } from "./state/useKeyboardShortcuts.js";
import { useLayerAndInteractionState } from "./state/useLayerAndInteractionState.js";
import { useLayoutRefs } from "./state/useLayoutRefs.js";
import { useMapSizeDialogState } from "./state/useMapSizeDialogState.js";
import { useMenuState } from "./state/useMenuState.js";
import { useSaveSelectionDialogState } from "./state/useSaveSelectionDialogState.js";
import { useTileState } from "./state/useTileState.js";
import { useUndoRedoState } from "./state/useUndoRedoState.js";
import { useZoomToRect } from "./state/useZoomToRect.js";

export function useLegacyMapBuilderState() {
  const projectNameRef = useRef("My Map");

  const layerState = useLayerAndInteractionState();
  const sceneState = useLegacySceneState({
    layers: layerState.layers,
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
  const canvasRefsState = useCanvasRefs(layerState.layers);
  const layoutRefs = useLayoutRefs();
  const tileState = useTileState();
  const undoRedoState = useUndoRedoState();

  const feedbackState = useFeedbackState();
  const promptUser = feedbackState.requestPrompt;
  const confirmUser = feedbackState.requestConfirm;

  const layoutState = useOverlayLayout({
    scrollRef: layoutRefs.scrollRef,
    topControlsWrapRef: layoutRefs.topControlsWrapRef,
    tileSize: tileState.tileSize,
    rows: sceneState.rows,
    cols: sceneState.cols,
    menuOpen: menuState.mapsMenuOpen,
  });

  const zoomState = useZoomControls({ setTileSize: tileState.setTileSize });

  const layerVisibilityState = useLayerVisibilityState(layerState.layers);
  const [showGridLines, setShowGridLines] = useState(true);
  const [engine, setEngine] = useState("grid");

  const { clamp, snap } = useClampAndSnap();

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

  const canvasDisplayState = useCanvasDisplayState();
  const {
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
  } = canvasDisplayState;

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
    setAssetsFolderDialogOpen: legacyAssetWorkflow.setAssetsFolderDialogOpen,
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
    setLayers: layerState.setLayers,
    setCurrentLayer: layerState.setCurrentLayer,
    setLayerVisibility: layerVisibilityState.setLayerVisibility,
  });

  const projectSavingState = useLegacyProjectSaving({
    layers: layerState.layers,
    isAssetsFolderConfigured,
    showToast: feedbackState.showToast,
    setNeedsAssetsFolder: legacyAssetWorkflow.setNeedsAssetsFolder,
    setAssetsFolderDialogOpen: legacyAssetWorkflow.setAssetsFolderDialogOpen,
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
    ...canvasDisplayState,
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
