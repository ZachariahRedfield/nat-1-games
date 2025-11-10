import React from "react";
import BrushSettings from "../../../BrushSettings.jsx";

export default function CanvasBrushSettingsPanel({
  panToolActive,
  zoomToolActive,
  assetGroup,
  engine,
  interactionMode,
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
}) {
  const showCanvasSettings =
    !panToolActive &&
    !zoomToolActive &&
    assetGroup !== "token" &&
    engine === "canvas" &&
    interactionMode !== "select";

  if (!showCanvasSettings) {
    return null;
  }

  return (
    <BrushSettings
      kind="canvas"
      gridSettings={gridSettings}
      setGridSettings={setGridSettings}
      naturalSettings={naturalSettings}
      setNaturalSettings={setNaturalSettings}
      brushSize={brushSize}
      setBrushSize={setBrushSize}
      canvasOpacity={canvasOpacity}
      setCanvasOpacity={setCanvasOpacity}
      canvasSpacing={canvasSpacing}
      setCanvasSpacing={setCanvasSpacing}
      canvasBlendMode={canvasBlendMode}
      setCanvasBlendMode={setCanvasBlendMode}
      canvasSmoothing={canvasSmoothing}
      setCanvasSmoothing={setCanvasSmoothing}
      tileSize={tileSize}
      snapshotSettings={snapshotSettings}
    />
  );
}
