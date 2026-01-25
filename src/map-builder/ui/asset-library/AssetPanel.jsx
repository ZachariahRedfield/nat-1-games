import React, { useMemo } from "react";
import AssetCreationToolbar from "./components/AssetCreationToolbar.jsx";
import AssetGroupSelector from "./components/AssetGroupSelector.jsx";
import AssetListSection from "./components/AssetListSection.jsx";
import { ASSET_GROUPS, assetMatchesGroup } from "./assetGrouping.js";
import useAssetPanelHandlers from "./hooks/useAssetPanelHandlers.js";

export default function AssetPanel(props) {
  const {
    assetGroup,
    setAssetGroup,
    showAssetPreviews,
    setShowAssetPreviews,
    assets,
    selectedAssetId,
    selectAsset,
    openCreator,
    setCreatorOpen,
    setAssets,
    setSelectedAssetId,
    confirmFn,
  } = props;

  const visibleAssets = useMemo(() => {
    const list = Array.isArray(assets) ? assets : [];
    return list.filter((asset) => assetMatchesGroup(asset, assetGroup));
  }, [assets, assetGroup]);

  const {
    handleSelectGroup,
    handleOpenCreator,
    handleSelectAsset,
    handleDeleteAsset,
    handleToggleView,
  } = useAssetPanelHandlers({
    setAssetGroup,
    setCreatorOpen,
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
      <AssetGroupSelector activeGroup={assetGroup} onSelectGroup={handleSelectGroup} />
      <AssetCreationToolbar
        activeGroup={assetGroup ?? ASSET_GROUPS.IMAGE}
        onOpenCreator={handleOpenCreator}
      />

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
