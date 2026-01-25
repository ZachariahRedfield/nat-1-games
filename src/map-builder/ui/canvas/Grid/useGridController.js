import { useRef, useState } from "react";
import useGridSelection from "./selection/useGridSelection.js";
import { createGridPointerHandlers } from "./controller/createGridPointerHandlers.js";
import { deriveCursorStyle } from "./controller/deriveCursorStyle.js";
import { cellBackground } from "./controller/cellBackground.js";
import usePanHotkey from "./controller/usePanHotkey.js";
import {
  useGridGeometry,
  DEFAULT_LAYER_VISIBILITY,
} from "./controller/grid-controller/useGridGeometry.js";
import { useBrushPreview } from "./controller/grid-controller/useBrushPreview.js";
import { createPlacementActions } from "./controller/grid-controller/createPlacementActions.js";
import { usePointerLifecycle } from "./controller/grid-controller/usePointerLifecycle.js";
import { useScrollBlocker } from "./controller/grid-controller/useScrollBlocker.js";
import { DEFAULT_NATURAL_SETTINGS } from "./controller/grid-controller/gridControllerDefaults.js";
import { createSelectionHitTesters } from "./controller/grid-controller/createSelectionHitTesters.js";
import {
  getTopMostObjectAt,
  getTopMostTokenAt,
} from "./controller/grid-controller/selectionTargets.js";

export function useGridController({
  layers = [],
  maps = {},
  objects,
  assets,
  engine,
  selectedAsset,
  gridSettings,
  stampSettings = null,
  setGridSettings,
  brushSize = 2,
  canvasOpacity = 0.35,
  canvasColor = null,
  canvasSpacing = 0.27,
  canvasBlendMode = "source-over",
  canvasSmoothing = 0.55,
  naturalSettings = DEFAULT_NATURAL_SETTINGS,
  isErasing = false,
  interactionMode = "draw",
  tileSize = 32,
  scrollRef,
  contentRef,
  canvasRefs,
  currentLayer: currentLayerProp,
  layerVisibility: layerVisibilityProp = DEFAULT_LAYER_VISIBILITY,
  tokensVisible = true,
  tokenHUDVisible = true,
  tokenHUDShowInitiative = false,
  assetGroup = "image",
  showGridLines = true,
  zoomToolActive = false,
  panToolActive = false,
  onZoomToolRect,
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
  onSelectionChange,
  tokens = [],
  addToken,
  moveToken,
  removeTokenById,
  updateTokenById,
  onTokenSelectionChange,
}) {
  const {
    currentLayer,
    rows,
    cols,
    cssWidth,
    cssHeight,
    bufferWidth,
    bufferHeight,
    layerIsVisible,
  } = useGridGeometry({
    layers,
    maps,
    currentLayer: currentLayerProp,
    layerVisibility: layerVisibilityProp,
    tileSize,
  });

  const panHotkey = usePanHotkey();

  const mouseDownRef = useRef(false);
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);
  const lastTileRef = useRef({ row: -1, col: -1 });
  const zoomDragRef = useRef(null);
  const dragRef = useRef(null);
  const [isSelectionDragging, setSelectionDragging] = useState(false);

  const pointerLifecycle = usePointerLifecycle({
    mouseDownRef,
    lastStampCssRef,
    emaCssRef,
    lastTileRef,
  });

  const { isPanning, setIsPanning, lastPan, setLastPan, isBrushing, setIsBrushing, mousePos, setMousePos } =
    pointerLifecycle;

  const stamp = stampSettings || gridSettings || {};

  const {
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    setSelectedObjId,
    setSelectedObjIds,
    setSelectedTokenId,
    setSelectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getObjectById,
    getTokenById,
  } = useGridSelection({
    objects,
    tokens,
    assets,
    currentLayer,
    gridSettings,
    rows,
    cols,
    dragRef,
    assetGroup,
    interactionMode,
    onSelectionChange,
    onTokenSelectionChange,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    updateObjectById,
    updateTokenById,
  });

  const { hitResizeHandle, hitRotateRing, hitTokenResizeHandle, hitTokenRotateRing } =
    createSelectionHitTesters({ getSelectedObject, getSelectedToken, tileSize });

  const { paintTipAt, stampBetweenCanvas } = useBrushPreview({
    canvasRefs,
    currentLayer,
    bufferWidth,
    bufferHeight,
    cssWidth,
    cssHeight,
    isErasing,
    canvasBlendMode,
    selectedAsset,
    stamp,
    gridSettings,
    canvasOpacity,
    brushSize,
    canvasColor,
    tileSize,
    canvasSpacing,
  });

  const topMostObjectAt = (layer, row, col) => getTopMostObjectAt(objects, layer, row, col);
  const topMostTokenAt = (row, col) => getTopMostTokenAt(tokens, row, col);

  const placementActions = createPlacementActions({
    rows,
    cols,
    gridSettings,
    objects,
    currentLayer,
    placeTiles,
    removeObjectById,
    selectedAsset,
    naturalSettings,
    stamp,
    addObject,
    canvasColor,
    assets,
    addToken,
  });

  useScrollBlocker({ scrollRef, contentRef, panToolActive, panHotkey, isPanning });

  const { handlePointerDown, handlePointerMove, handlePointerUp } = createGridPointerHandlers({
    geometry: { rows, cols, cssWidth, cssHeight },
    refs: {
      mouseDownRef,
      zoomDragRef,
      dragRef,
      lastStampCssRef,
      emaCssRef,
      lastTileRef,
      scrollRef,
    },
    selection: {
      hitResizeHandle,
      hitRotateRing,
      hitTokenResizeHandle,
      hitTokenRotateRing,
      setSelectedObjId,
      setSelectedObjIds,
      setSelectedTokenId,
      setSelectedTokenIds,
      selectedObjId,
      selectedObjIds,
      selectedTokenId,
      selectedTokenIds,
      getObjectById,
      getTokenById,
      getTopMostObjectAt: topMostObjectAt,
      getTopMostTokenAt: topMostTokenAt,
    },
    state: {
      setMousePos,
      setIsPanning,
      setLastPan,
      setIsBrushing,
      isPanning,
      lastPan,
      panHotkey,
      setSelectionDragging,
    },
    config: {
      zoomToolActive,
      panToolActive,
      layerIsVisible,
      interactionMode,
      engine,
      assetGroup,
      selectedAsset,
      isErasing,
      canvasColor,
      canvasSmoothing,
      gridSettings,
      setGridSettings,
      currentLayer,
    },
    actions: {
      placeGridImageAt: placementActions.placeGridImageAt,
      placeGridColorStampAt: placementActions.placeGridColorStampAt,
      eraseGridStampAt: placementActions.eraseGridStampAt,
      placeTokenAt: placementActions.placeTokenAt,
      moveObject,
      moveToken,
      updateObjectById,
      updateTokenById,
      onSelectionChange,
      onTokenSelectionChange,
    },
    callbacks: {
      onBeginTileStroke,
      onBeginCanvasStroke,
      onBeginObjectStroke,
      onBeginTokenStroke,
      onZoomToolRect,
    },
    data: {
      tokens,
      objects,
      paintTipAt,
      stampBetweenCanvas,
    },
  });

  const cursorStyle = deriveCursorStyle({
    isPanning,
    panHotkey,
    panToolActive,
    dragRef,
    zoomToolActive,
    layerIsVisible,
    mousePos,
    engine,
    gridSettings,
    hitResizeHandle,
    hitTokenResizeHandle,
    hitRotateRing,
    hitTokenRotateRing,
  });

  const cellBg = cellBackground;

  return {
    rows,
    cols,
    cssWidth,
    cssHeight,
    bufferWidth,
    bufferHeight,
    layerIsVisible,
    mousePos,
    cursorStyle,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getTokenById,
    dragRef,
    zoomDragRef,
    isSelectionDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cellBg,
  };
}

export default useGridController;
