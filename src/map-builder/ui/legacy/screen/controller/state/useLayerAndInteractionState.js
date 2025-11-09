import { useState } from "react";

export function useLayerAndInteractionState() {
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

export default useLayerAndInteractionState;
