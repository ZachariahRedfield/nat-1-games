import React from "react";
import CanvasBrushControls from "../CanvasBrushControls.jsx";
import SectionTitle from "./components/SectionTitle.jsx";

export default function CanvasBrushSettings({
  titleOverride,
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
  return (
    <div>
      <SectionTitle title={titleOverride || "Settings"} />
      <CanvasBrushControls
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
    </div>
  );
}
