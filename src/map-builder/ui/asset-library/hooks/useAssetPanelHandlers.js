import { useCallback } from "react";
export default function useAssetPanelHandlers({
  openCreator,
  selectAsset,
  openEditAsset,
  confirmFn,
  visibleAssets,
  setAssets,
  setSelectedAssetId,
  setShowAssetPreviews,
}) {
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

  const handleEditAsset = useCallback(
    (asset) => {
      if (!asset) return;
      selectAsset?.(asset.id);
      openEditAsset?.(asset);
    },
    [openEditAsset, selectAsset],
  );

  const handleToggleView = useCallback(
    (show) => {
      setShowAssetPreviews?.(show);
    },
    [setShowAssetPreviews],
  );

  return {
    handleOpenCreator,
    handleSelectAsset,
    handleEditAsset,
    handleDeleteAsset,
    handleToggleView,
  };
}
