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
import { deepCopyGrid, deepCopyObjects } from "../../utils.js";

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
  const { setUndoStack, setRedoStack } = undoRedoState;

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

  const {
    addLayer: baseAddLayer,
    removeLayer: baseRemoveLayer,
    renameLayer: baseRenameLayer,
    moveLayer: baseMoveLayer,
  } = layerState;
  const layerList = layerState.layers || [];

  const captureLayerHistorySnapshot = useCallback(
    ({ includeMaps = false, includeObjects = false, includeCanvasFor } = {}) => {
      const snapshot = {
        type: "layers",
        layers: layerList.map((layer) => ({ ...layer })),
        currentLayer: layerState.currentLayer,
        layerVisibility: { ...layerVisibilityState.layerVisibility },
      };

      if (includeMaps) {
        const mapSnapshot = {};
        Object.entries(sceneState.maps || {}).forEach(([id, grid]) => {
          mapSnapshot[id] = deepCopyGrid(grid);
        });
        if (Object.keys(mapSnapshot).length) {
          snapshot.maps = mapSnapshot;
        }
      }

      if (includeObjects) {
        const objectSnapshot = {};
        Object.entries(sceneState.objects || {}).forEach(([id, list]) => {
          objectSnapshot[id] = deepCopyObjects(list);
        });
        if (Object.keys(objectSnapshot).length) {
          snapshot.objects = objectSnapshot;
        }
      }

      if (includeCanvasFor && includeCanvasFor.length) {
        const canvasSnapshot = {};
        includeCanvasFor.forEach((layerId) => {
          const canvas = canvasRefsState.canvasRefs?.[layerId]?.current;
          if (!canvas) return;
          try {
            canvasSnapshot[layerId] = canvas.toDataURL();
          } catch (error) {
            // Ignore snapshot failures (e.g., tainted canvas)
          }
        });
        if (Object.keys(canvasSnapshot).length) {
          snapshot.canvasSnapshots = canvasSnapshot;
        }
      }

      return snapshot;
    },
    [
      canvasRefsState.canvasRefs,
      layerState.currentLayer,
      layerVisibilityState.layerVisibility,
      layerList,
      sceneState.maps,
      sceneState.objects,
    ],
  );

  const pushLayerHistory = useCallback(
    ({ includeMaps = false, includeObjects = false, includeCanvas = false, targetLayerId, targetLayerIds } = {}) => {
      const layerIds = targetLayerIds
        ? targetLayerIds.filter(Boolean)
        : targetLayerId
        ? [targetLayerId]
        : [];

      const entry = captureLayerHistorySnapshot({
        includeMaps,
        includeObjects,
        includeCanvasFor: includeCanvas ? layerIds : undefined,
      });

      setUndoStack((prev) => [...prev, entry]);
      setRedoStack([]);
    },
    [captureLayerHistorySnapshot, setRedoStack, setUndoStack],
  );

  const addLayerWithHistory = useCallback(() => {
    pushLayerHistory({});
    baseAddLayer();
  }, [baseAddLayer, pushLayerHistory]);

  const removeLayerWithHistory = useCallback(
    (layerId) => {
      if (!layerId) return;
      if ((layerList || []).length <= 1) {
        baseRemoveLayer(layerId);
        return;
      }
      pushLayerHistory({
        includeMaps: true,
        includeObjects: true,
        includeCanvas: true,
        targetLayerId: layerId,
      });
      baseRemoveLayer(layerId);
    },
    [baseRemoveLayer, layerList, pushLayerHistory],
  );

  const renameLayerWithHistory = useCallback(
    (layerId, name) => {
      if (!layerId) return;
      pushLayerHistory({});
      baseRenameLayer(layerId, name);
    },
    [baseRenameLayer, pushLayerHistory],
  );

  const reorderLayerWithHistory = useCallback(
    (layerId, targetIndex) => {
      if (!layerId) return;
      const currentIndex = layerList.findIndex((layer) => layer.id === layerId);
      if (currentIndex < 0) return;
      const clampedTarget = Math.max(0, Math.min(layerList.length - 1, targetIndex ?? 0));
      if (currentIndex === clampedTarget) return;
      pushLayerHistory({});
      baseMoveLayer(layerId, clampedTarget);
    },
    [baseMoveLayer, layerList, pushLayerHistory],
  );
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

  const zoomToFit = useCallback(() => {
    const rows = Number(sceneState.rows) || 0;
    const cols = Number(sceneState.cols) || 0;
    const tileSize = Number(tileState.tileSize) || 0;
    if (!rows || !cols || !tileSize) return;
    handleZoomToRect({
      left: 0,
      top: 0,
      width: cols * tileSize,
      height: rows * tileSize,
      allowZoomOut: true,
    });
  }, [handleZoomToRect, sceneState.cols, sceneState.rows, tileState.tileSize]);

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
    layers: layerList,
    setLayers: layerState.setLayers,
    setCurrentLayer: layerState.setCurrentLayer,
    layerVisibility: layerVisibilityState.layerVisibility,
    setLayerVisibility: layerVisibilityState.setLayerVisibility,
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
    addLayer: addLayerWithHistory,
    removeLayer: removeLayerWithHistory,
    renameLayer: renameLayerWithHistory,
    reorderLayer: reorderLayerWithHistory,
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
    zoomToFit,
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
