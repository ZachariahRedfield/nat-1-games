import React from "react";
import { TextCommitInput } from "../../../../../../shared/index.js";
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
  updateObjectById,
  currentLayer,
}) {
  const brushKind = interactionMode === "select" ? "grid" : assetGroup === "natural" ? "natural" : "grid";
  const titleOverride = interactionMode === "select" ? "Settings" : undefined;
  const canRenameAsset = Boolean(selectedObj?.id && currentLayer && updateObjectById);
  const assetDisplayName = selectedObj?.name ?? "";

  return (
    <>
      {canRenameAsset ? (
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-gray-400" htmlFor="placed-asset-name-input">
            Placed Asset Name
          </label>
          <TextCommitInput
            id="placed-asset-name-input"
            className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
            value={assetDisplayName}
            placeholder="Name this placed asset"
            onCommit={(value) => {
              updateObjectById?.(currentLayer, selectedObj.id, { name: value });
            }}
          />
        </div>
      ) : null}
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
