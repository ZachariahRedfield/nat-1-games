import React from "react";
import BrushSettings from "../../../BrushSettings.jsx";
import AssetLabelSettings from "./AssetLabelSettings.jsx";

export default function AssetSettingsPanel({
  interactionMode,
  assetGroup,
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
  selectedObj,
  selectedObjsList,
  assets,
  regenerateLabelInstance,
}) {
  const brushKind = interactionMode === "select" ? "grid" : assetGroup === "natural" ? "natural" : "grid";
  const titleOverride = interactionMode === "select" ? "Settings" : undefined;

  return (
    <>
      <BrushSettings
        kind={brushKind}
        titleOverride={titleOverride}
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

      <AssetLabelSettings
        selectedObj={selectedObj}
        selectedObjsList={selectedObjsList}
        assets={assets}
        snapshotSettings={snapshotSettings}
        regenerateLabelInstance={regenerateLabelInstance}
      />
    </>
  );
}
