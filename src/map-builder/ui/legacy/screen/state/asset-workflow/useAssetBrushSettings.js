import { useState } from "react";

export function useAssetBrushSettings() {
  const [brushSize, setBrushSize] = useState(2);
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27);
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(0.55);

  return {
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
  };
}

export default useAssetBrushSettings;
