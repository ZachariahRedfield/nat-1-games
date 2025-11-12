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
      <BrushSettings
        kind="natural"
        gridSettings={assetStamp}
        setGridSettings={persistAssetStamp}
        naturalSettings={naturalSettings}
        setNaturalSettings={persistNaturalSettings}
        titleOverride="Settings"
        showSnapControls={false}
        showStep={false}
        hideNaturalSize
      />
    );
  }

  const isToken = selectedAsset?.kind === "token";

  return (
    <BrushSettings
      kind="grid"
      gridSettings={assetStamp}
      setGridSettings={persistAssetStamp}
      titleOverride="Settings"
      showSnapControls={false}
      showStep={selectedAsset?.kind !== "token" && selectedAsset?.kind !== "tokenGroup"}
      tokenHighlightColor={isToken ? selectedAsset?.glowDefault ?? DEFAULT_TOKEN_GLOW : undefined}
      onChangeTokenHighlight={
        isToken && selectedAsset?.id
          ? (hex) => updateAssetById?.(selectedAsset.id, { glowDefault: hex })
          : undefined
      }
    />
  );
}
