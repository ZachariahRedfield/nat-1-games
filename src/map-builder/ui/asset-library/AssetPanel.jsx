import React, { useCallback, useMemo } from "react";
import AssetCard from "./components/AssetCard.jsx";
import AssetCreationToolbar from "./components/AssetCreationToolbar.jsx";
import AssetGroupSelector from "./components/AssetGroupSelector.jsx";
import AssetViewToggle from "./components/AssetViewToggle.jsx";
import { ASSET_GROUPS, assetMatchesGroup, determineCreatorKind } from "./assetGrouping.js";

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
    setEditingAsset,
    setAssets,
    setSelectedAssetId,
    confirmFn,
  } = props;

  const visibleAssets = useMemo(() => {
    const list = Array.isArray(assets) ? assets : [];
    return list.filter((asset) => assetMatchesGroup(asset, assetGroup));
  }, [assets, assetGroup]);

  const handleSelectGroup = useCallback(
    (group) => {
      setAssetGroup?.(group);
      setCreatorOpen?.(false);
    },
    [setAssetGroup, setCreatorOpen],
  );

  const handleOpenCreator = useCallback(
    (kind) => {
      openCreator?.(kind);
    },
    [openCreator],
  );

  const handleSelectAsset = useCallback(
    (assetId) => {
      selectAsset?.(assetId);
    },
    [selectAsset],
  );

  const handleEditAsset = useCallback(
    (asset) => {
      if (!asset) return;
      setEditingAsset?.(asset);
      const nextKind = determineCreatorKind(asset);
      openCreator?.(nextKind);
    },
    [setEditingAsset, openCreator],
  );

  const handleDeleteAsset = useCallback(
    async (asset) => {
      if (!asset) return;
      const message = `Delete asset "${asset.name}"?`;
      const confirmed = confirmFn ? await confirmFn(message) : window.confirm(message);
      if (!confirmed) return;

      const nextAsset = visibleAssets.find((entry) => entry.id !== asset.id);
      setAssets?.((prev) => prev.filter((entry) => entry.id !== asset.id));
      if (nextAsset) {
        setSelectedAssetId?.(nextAsset.id);
      }
    },
    [confirmFn, visibleAssets, setAssets, setSelectedAssetId],
  );

  const handleToggleView = useCallback(
    (show) => {
      setShowAssetPreviews?.(show);
    },
    [setShowAssetPreviews],
  );

  return (
    <div className="relative">
      <AssetGroupSelector activeGroup={assetGroup} onSelectGroup={handleSelectGroup} />
      <AssetCreationToolbar activeGroup={assetGroup ?? ASSET_GROUPS.IMAGE} onOpenCreator={handleOpenCreator} />

      <div className="mb-2 border border-gray-600 rounded overflow-hidden">
        <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
          <span className="text-xs uppercase tracking-wide">Assets</span>
          <AssetViewToggle showPreview={!!showAssetPreviews} onChange={handleToggleView} />
        </div>

        <div
          className={`p-2 ${
            showAssetPreviews
              ? "grid grid-cols-2 md:grid-cols-3 gap-4"
              : "grid grid-cols-2 md:grid-cols-3 gap-2"
          }`}
        >
          {visibleAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAssetId === asset.id}
              showPreview={!!showAssetPreviews}
              onSelect={handleSelectAsset}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
