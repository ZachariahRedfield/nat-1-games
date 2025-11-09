import { useCallback, useRef, useState } from "react";
import { BASE_TILE } from "./utils.js";
import useGridSelection from "./selection/useGridSelection.js";
import {
  hitObjectResizeHandle as baseHitObjectResizeHandle,
  hitObjectRotateRing as baseHitObjectRotateRing,
  hitTokenResizeHandle as baseHitTokenResizeHandle,
  hitTokenRotateRing as baseHitTokenRotateRing,
} from "./controller/selectionHitTests.js";
import {
  paintBrushTip as renderBrushTip,
  stampBetweenCanvas as connectBrushPoints,
} from "./controller/brushPreview.js";
import {
  eraseGridStampAt as eraseGridStamp,
  placeGridImageAt as placeGridImage,
  placeGridColorStampAt as placeGridColorStamp,
  placeTokenAt as placeToken,
} from "./controller/gridPlacement.js";
import usePanHotkey from "./controller/usePanHotkey.js";
import useGlobalPointerRelease from "./controller/useGlobalPointerRelease.js";
import { createGridPointerHandlers } from "./controller/createGridPointerHandlers.js";
import { deriveCursorStyle } from "./controller/deriveCursorStyle.js";
import { cellBackground } from "./controller/cellBackground.js";

const DEFAULT_LAYER_VISIBILITY = { background: true, base: true, sky: true };
const DEFAULT_NATURAL_SETTINGS = {
  randomRotation: false,
  randomFlipX: false,
  randomFlipY: false,
  randomSize: { enabled: false, min: 1, max: 1 },
  randomOpacity: { enabled: false, min: 1, max: 1 },
  randomVariant: true,
};

export function useGridController({
  maps,
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
  contentRef, // kept for API parity even though controller does not use it directly
  canvasRefs,
  currentLayer = "base",
  layerVisibility = DEFAULT_LAYER_VISIBILITY,
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
  const rows = maps.base.length;
  const cols = maps.base[0].length;

  const cssWidth = cols * tileSize;
  const cssHeight = rows * tileSize;
  const bufferWidth = cols * BASE_TILE;
  const bufferHeight = rows * BASE_TILE;

  const layerIsVisible = layerVisibility?.[currentLayer] !== false;

  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const panHotkey = usePanHotkey();

  const mouseDownRef = useRef(false);
  const lastStampCssRef = useRef(null);
  const emaCssRef = useRef(null);
  const lastTileRef = useRef({ row: -1, col: -1 });
  const zoomDragRef = useRef(null);
  const dragRef = useRef(null);

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

  const hitResizeHandle = (xCss, yCss) =>
    baseHitObjectResizeHandle(xCss, yCss, { getSelectedObject, tileSize });

  const hitRotateRing = (xCss, yCss) =>
    baseHitObjectRotateRing(xCss, yCss, { getSelectedObject, tileSize });

  const hitTokenResizeHandle = (xCss, yCss) =>
    baseHitTokenResizeHandle(xCss, yCss, { getSelectedToken, tileSize });

  const hitTokenRotateRing = (xCss, yCss) =>
    baseHitTokenRotateRing(xCss, yCss, { getSelectedToken, tileSize });

  const toCanvasCoords = (xCss, yCss) => {
    const scaleX = bufferWidth / cssWidth;
    const scaleY = bufferHeight / cssHeight;
    return { x: xCss * scaleX, y: yCss * scaleY };
  };

  const getActiveCtx = () => {
    const canvas = canvasRefs?.[currentLayer]?.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const brushPreviewContext = {
    getActiveCtx,
    toCanvasCoords,
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
  };

  const paintTipAt = (cssPoint) => renderBrushTip(cssPoint, brushPreviewContext);
  const stampBetweenCanvas = (a, b) => connectBrushPoints(a, b, brushPreviewContext);

  const getTopMostObjectAt = (layer, r, c) => {
    const arr = objects[layer] || [];
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      const inside =
        r >= o.row &&
        r < o.row + o.hTiles &&
        c >= o.col &&
        c < o.col + o.wTiles;
      if (inside) return o;
    }
    return null;
  };

  const getTopMostTokenAt = (r, c) => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      const inside =
        r >= t.row && r < t.row + (t.hTiles || 1) &&
        c >= t.col && c < t.col + (t.wTiles || 1);
      if (inside) return t;
    }
    return null;
  };

  const placementContext = {
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
  };

  const eraseGridStampAt = (row, col) => eraseGridStamp(row, col, placementContext);
  const placeGridImageAt = (row, col) => placeGridImage(row, col, placementContext);
  const placeGridColorStampAt = (row, col) => placeGridColorStamp(row, col, placementContext);
  const placeTokenAt = (row, col) => placeToken(row, col, placementContext);

  const resetPointerState = useCallback(() => {
    mouseDownRef.current = false;
    setIsBrushing(false);
    setIsPanning(false);
    setLastPan(null);
    lastStampCssRef.current = null;
    emaCssRef.current = null;
    lastTileRef.current = { row: -1, col: -1 };
  }, [setIsBrushing, setIsPanning, setLastPan]);

  useGlobalPointerRelease(resetPointerState);

  const { handlePointerDown, handlePointerMove, handlePointerUp } =
    createGridPointerHandlers({
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
        getTopMostObjectAt,
        getTopMostTokenAt,
      },
      state: {
        setMousePos,
        setIsPanning,
        setLastPan,
        setIsBrushing,
        isPanning,
        lastPan,
        panHotkey,
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
        placeGridImageAt,
        placeGridColorStampAt,
        eraseGridStampAt,
        placeTokenAt,
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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cellBg,
  };
}

export default useGridController;
