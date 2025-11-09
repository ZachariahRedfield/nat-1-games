import { useCallback, useState } from "react";

export function useCanvasDisplayState() {
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [canvasSpacing, setCanvasSpacing] = useState(0);
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(true);
  const [naturalSettings, setNaturalSettings] = useState(null);

  const snapshotSettings = useCallback(() => {}, []);

  return {
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
  };
}

export default useCanvasDisplayState;
