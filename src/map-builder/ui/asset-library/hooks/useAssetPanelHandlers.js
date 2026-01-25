import { useCallback } from "react";
import { determineCreatorKind } from "../assetGrouping.js";

export default function useAssetPanelHandlers({
  setAssetGroup,
  setCreatorOpen,
  openCreator,
  selectAsset,
  setEditingAsset,
  confirmFn,
  visibleAssets,
  setAssets,
  setSelectedAssetId,
  setShowAssetPreviews,
}) {
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

  return {
    handleSelectGroup,
    handleOpenCreator,
    handleSelectAsset,
    handleEditAsset,
    handleDeleteAsset,
    handleToggleView,
  };
}
