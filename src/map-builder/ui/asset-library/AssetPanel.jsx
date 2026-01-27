import React, { useMemo } from "react";
import AssetCreationToolbar from "./components/AssetCreationToolbar.jsx";
import AssetListSection from "./components/AssetListSection.jsx";
import { assetMatchesGroup } from "./assetGrouping.js";
import useAssetPanelHandlers from "./hooks/useAssetPanelHandlers.js";

export default function AssetPanel(props) {
  const {
    showAssetPreviews,
    setShowAssetPreviews,
    assets,
    selectedAssetId,
    selectAsset,
    openCreator,
    setAssets,
    setSelectedAssetId,
    confirmFn,
  } = props;

  const visibleAssets = useMemo(() => {
    const list = Array.isArray(assets) ? assets : [];
    return list.filter((asset) => assetMatchesGroup(asset));
  }, [assets]);

  const {
    handleOpenCreator,
    handleSelectAsset,
    handleDeleteAsset,
    handleToggleView,
  } = useAssetPanelHandlers({
    openCreator,
    selectAsset,
    confirmFn,
    visibleAssets,
    setAssets,
    setSelectedAssetId,
    setShowAssetPreviews,
  });

  return (
    <div className="relative">
      <AssetCreationToolbar onOpenCreator={handleOpenCreator} />

      <AssetListSection
        assets={visibleAssets}
        showAssetPreviews={showAssetPreviews}
        onToggleView={handleToggleView}
        selectedAssetId={selectedAssetId}
        onSelect={handleSelectAsset}
        onDelete={handleDeleteAsset}
      />
    </div>
  );
}
