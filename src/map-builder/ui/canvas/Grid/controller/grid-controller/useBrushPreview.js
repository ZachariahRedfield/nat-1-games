import { useCallback, useMemo } from "react";
import {
  paintBrushTip as renderBrushTip,
  stampBetweenCanvas as connectBrushPoints,
} from "../brushPreview.js";

function createCanvasCoordinateMapper({ bufferWidth, bufferHeight, cssWidth, cssHeight }) {
  return (xCss, yCss) => {
    const scaleX = cssWidth > 0 ? bufferWidth / cssWidth : 1;
    const scaleY = cssHeight > 0 ? bufferHeight / cssHeight : 1;
    return { x: xCss * scaleX, y: yCss * scaleY };
  };
}

export function useBrushPreview({
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
}) {
  const toCanvasCoords = useMemo(
    () => createCanvasCoordinateMapper({ bufferWidth, bufferHeight, cssWidth, cssHeight }),
    [bufferWidth, bufferHeight, cssWidth, cssHeight]
  );

  const getActiveCtx = useCallback(() => {
    const canvas = canvasRefs?.[currentLayer]?.current;
    return canvas ? canvas.getContext("2d") : null;
  }, [canvasRefs, currentLayer]);

  const brushPreviewContext = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const paintTipAt = useCallback(
    (cssPoint) => renderBrushTip(cssPoint, brushPreviewContext),
    [brushPreviewContext]
  );

  const stampBetweenCanvas = useCallback(
    (from, to) => connectBrushPoints(from, to, brushPreviewContext),
    [brushPreviewContext]
  );

  return { paintTipAt, stampBetweenCanvas };
}

export default useBrushPreview;
