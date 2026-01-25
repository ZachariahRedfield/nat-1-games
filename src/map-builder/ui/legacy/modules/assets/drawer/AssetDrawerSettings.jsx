import { useCallback } from "react";
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
}) {
  const { selectedAsset, selectedAssetId, updateAssetById } = assetPanelProps;
  const assetName = selectedAsset?.name ?? "";

  const handleNameChange = useCallback(
    (event) => {
      if (!selectedAssetId) return;
      updateAssetById?.(selectedAssetId, { name: event.target.value });
    },
    [selectedAssetId, updateAssetById]
  );

  const persistAssetStamp = useCallback(
    (updater) => withAssetPersistence(updater, setAssetStamp, selectedAssetId, updateAssetById, "stampDefaults"),
    [setAssetStamp, selectedAssetId, updateAssetById]
  );

  const persistNaturalSettings = useCallback(
    (updater) => withAssetPersistence(updater, setNaturalSettings, selectedAssetId, updateAssetById, "naturalDefaults"),
    [setNaturalSettings, selectedAssetId, updateAssetById]
  );

  if (selectedAsset?.kind === "natural") {
    return (
      <>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-gray-400" htmlFor="asset-name-input">
            Asset Name
          </label>
          <input
            id="asset-name-input"
            type="text"
            value={assetName}
            onChange={handleNameChange}
            disabled={!selectedAssetId}
            className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Name this asset"
          />
        </div>
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
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-gray-400" htmlFor="asset-name-input">
          Asset Name
        </label>
        <input
          id="asset-name-input"
          type="text"
          value={assetName}
          onChange={handleNameChange}
          disabled={!selectedAssetId}
          className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Name this asset"
        />
      </div>
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
