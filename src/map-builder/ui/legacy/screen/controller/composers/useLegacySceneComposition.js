import { useCallback, useRef, useState } from "react";
import { useLegacySceneState } from "../../../modules/editor/useLegacySceneState.js";
import { useOverlayLayout } from "../../../modules/layout/useOverlayLayout.js";
import { useZoomControls } from "../../../modules/interaction/useZoomControls.js";
import { useFeedbackState } from "../../../modules/feedback/useFeedbackState.js";
import { useGridSelectionState } from "../../state/useGridSelectionState.js";
import { useTokenSelectionState } from "../../state/useTokenSelectionState.js";
import { useLayerVisibilityState } from "../../state/useLayerVisibilityState.js";
import { useCanvasDisplayState } from "../state/useCanvasDisplayState.js";
import { useCanvasRefs } from "../state/useCanvasRefs.js";
import { useClampAndSnap } from "../state/useClampSnap.js";
import { useGridDimensionsInputs } from "../state/useGridDimensionsInputs.js";
import { useGridSettingsState } from "../state/useGridSettingsState.js";
import { useKeyboardShortcuts } from "../state/useKeyboardShortcuts.js";
import { useLayerAndInteractionState } from "../state/useLayerAndInteractionState.js";
import { useLayerHistoryHandlers } from "../state/useLayerHistoryHandlers.js";
import { useLayoutRefs } from "../state/useLayoutRefs.js";
import { useMapSizeDialogState } from "../state/useMapSizeDialogState.js";
import { useMenuState } from "../state/useMenuState.js";
import { useSaveSelectionDialogState } from "../state/useSaveSelectionDialogState.js";
import { useScrollSyncedTileSize } from "../state/useScrollSyncedTileSize.js";
import { useTileState } from "../state/useTileState.js";
import { useUndoRedoState } from "../state/useUndoRedoState.js";
import { useZoomToRect } from "../state/useZoomToRect.js";

export function useLegacySceneComposition() {
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
  const setTileSize = useScrollSyncedTileSize({
    baseSetTileSize: tileState.setTileSize,
    scrollRef: layoutRefs.scrollRef,
    gridContentRef: layoutRefs.gridContentRef,
    rows: sceneState.rows,
    cols: sceneState.cols,
  });
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

  const zoomState = useZoomControls({ setTileSize });

  const layerVisibilityState = useLayerVisibilityState(layerState.layers, ["tokens"]);
  const layerList = layerState.layers || [];

  const {
    addLayerWithHistory,
    removeLayerWithHistory,
    renameLayerWithHistory,
    reorderLayerWithHistory,
  } = useLayerHistoryHandlers({
    layerState,
    layerVisibilityState,
    canvasRefs: canvasRefsState.canvasRefs,
    sceneMaps: sceneState.maps,
    sceneObjects: sceneState.objects,
    setUndoStack,
    setRedoStack,
  });

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
    setTileSize,
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
    layerState,
    sceneState,
    gridSettingsState,
    gridSelectionState,
    tokenSelectionState,
    saveSelectionDialogState,
    menuState,
    mapSizeDialogState,
    canvasRefsState,
    layoutRefs,
    tileState,
    setTileSize,
    undoRedoState,
    feedbackState,
    promptUser,
    confirmUser,
    layoutState,
    zoomState,
    layerVisibilityState,
    layerList,
    addLayerWithHistory,
    removeLayerWithHistory,
    renameLayerWithHistory,
    reorderLayerWithHistory,
    showGridLines,
    setShowGridLines,
    engine,
    setEngine,
    clamp,
    snap,
    handleZoomToRect,
    zoomToFit,
    canvasDisplayState,
    handleChangeRows,
    handleChangeCols,
    applyMapSize,
  };
}

export default useLegacySceneComposition;
