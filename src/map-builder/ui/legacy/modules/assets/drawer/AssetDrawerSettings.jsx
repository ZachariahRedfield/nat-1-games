import { useCallback } from "react";
import { NumericInput } from "../../../../../../shared/index.js";
import BrushSettings from "../../../BrushSettings.jsx";

const DEFAULT_TOKEN_GLOW = "#7dd3fc";

function withAssetPersistence(updater, setState, assetId, updateAssetById, field) {
  if (!setState) return;
  setState((previous) => {
    const nextState = typeof updater === "function" ? updater(previous) : updater;
    if (assetId && updateAssetById && nextState) {
      try {
        updateAssetById(assetId, { [field]: nextState });
      } catch (error) {
        // Silently ignore persistence failures to avoid interrupting the editor flow.
      }
    }
    return nextState;
  });
}

export default function AssetDrawerSettings({
  assetPanelProps = {},
  assetStamp,
  setAssetStamp,
  naturalSettings,
  setNaturalSettings,
  engine,
  interactionMode,
  brushSize,
  setBrushSize,
  tileSize,
  snapshotSettings,
}) {
  const { selectedAsset, selectedAssetId, updateAssetById } = assetPanelProps;

  const persistAssetStamp = useCallback(
    (updater) => withAssetPersistence(updater, setAssetStamp, selectedAssetId, updateAssetById, "stampDefaults"),
    [setAssetStamp, selectedAssetId, updateAssetById]
  );

  const persistNaturalSettings = useCallback(
    (updater) => withAssetPersistence(updater, setNaturalSettings, selectedAssetId, updateAssetById, "naturalDefaults"),
    [setNaturalSettings, selectedAssetId, updateAssetById]
  );

  const handleBrushSizeChange = useCallback(
    (value) => {
      const next = Math.max(0.01, Math.min(100, parseFloat(value)));
      if (Number.isNaN(next)) return;
      snapshotSettings?.();
      setBrushSize?.(next);
    },
    [setBrushSize, snapshotSettings]
  );

  const showCanvasBrushSize = engine === "canvas" && interactionMode !== "select";
  const canvasBrushSizeControl = showCanvasBrushSize ? (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-gray-400">Canvas Brush Size</label>
      <div className="flex items-center gap-2">
        <NumericInput
          value={brushSize ?? 1}
          min={0.01}
          max={100}
          step={0.01}
          className="w-14 px-1 py-0.5 text-xs text-black rounded"
          onCommit={handleBrushSizeChange}
        />
        <input
          className="flex-1 h-2 accent-sky-400"
          type="range"
          min={0.01}
          max={100}
          step={0.01}
          value={brushSize ?? 1}
          onChange={(event) => handleBrushSizeChange(event.target.value)}
          aria-label="Canvas brush size"
        />
      </div>
      <div className="text-xs text-gray-300">~{(brushSize ?? 1) * (tileSize ?? 0)}px</div>
    </div>
  ) : null;

  if (selectedAsset?.kind === "natural") {
    return (
      <>
        {canvasBrushSizeControl}
        <BrushSettings
          kind="natural"
          gridSettings={assetStamp}
          setGridSettings={persistAssetStamp}
          naturalSettings={naturalSettings}
          setNaturalSettings={persistNaturalSettings}
          titleOverride="Settings"
          hideNaturalSize
        />
      </>
    );
  }

  const isToken = selectedAsset?.kind === "token";

  return (
    <>
      {canvasBrushSizeControl}
      <BrushSettings
        kind="grid"
        gridSettings={assetStamp}
        setGridSettings={persistAssetStamp}
        titleOverride="Settings"
        tokenHighlightColor={isToken ? selectedAsset?.glowDefault ?? DEFAULT_TOKEN_GLOW : undefined}
        onChangeTokenHighlight={
          isToken && selectedAsset?.id
            ? (hex) => updateAssetById?.(selectedAsset.id, { glowDefault: hex })
            : undefined
        }
      />
    </>
  );
}
