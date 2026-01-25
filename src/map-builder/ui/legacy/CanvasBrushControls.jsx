import React from "react";
import BlendModeSelect from "./brush-controls/BlendModeSelect.jsx";
import BrushSizeControl from "./brush-controls/BrushSizeControl.jsx";
import OpacitySpacingControls from "./brush-controls/OpacitySpacingControls.jsx";
import SmoothingControl from "./brush-controls/SmoothingControl.jsx";

export default function CanvasBrushControls({
  brushSize,
  setBrushSize,
  canvasOpacity,
  setCanvasOpacity,
  canvasSpacing,
  setCanvasSpacing,
  canvasBlendMode = "source-over",
  setCanvasBlendMode,
  canvasSmoothing = 0.55,
  setCanvasSmoothing,
  tileSize,
  snapshotSettings,
}) {
  return (
    <div>
      <BrushSizeControl
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        tileSize={tileSize}
        snapshotSettings={snapshotSettings}
      />

      <OpacitySpacingControls
        canvasOpacity={canvasOpacity}
        setCanvasOpacity={setCanvasOpacity}
        canvasSpacing={canvasSpacing}
        setCanvasSpacing={setCanvasSpacing}
        snapshotSettings={snapshotSettings}
      />

      <SmoothingControl
        canvasSmoothing={canvasSmoothing}
        setCanvasSmoothing={setCanvasSmoothing}
        snapshotSettings={snapshotSettings}
      />

      <BlendModeSelect
        canvasBlendMode={canvasBlendMode}
        setCanvasBlendMode={setCanvasBlendMode}
        snapshotSettings={snapshotSettings}
      />
    </div>
  );
}
