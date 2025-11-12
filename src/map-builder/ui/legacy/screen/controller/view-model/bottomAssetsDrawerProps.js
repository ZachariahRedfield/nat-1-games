export function createBottomAssetsDrawerProps(state) {
  const assetPanelProps = {
    assetGroup: state.assetGroup,
    setAssetGroup: state.setAssetGroup,
    showAssetKindMenu: state.showAssetKindMenu,
    setShowAssetKindMenu: state.setShowAssetKindMenu,
    showAssetPreviews: state.showAssetPreviews,
    setShowAssetPreviews: state.setShowAssetPreviews,
    assets: state.assets,
    selectedAssetId: state.selectedAssetId,
    selectedAsset: state.selectedAsset,
    selectAsset: state.selectAsset,
    tokens: state.tokens,
    objects: state.objects,
    creatorOpen: state.creatorOpen,
    creatorKind: state.creatorKind,
    editingAsset: state.editingAsset,
    openCreator: state.openCreator,
    setCreatorOpen: state.setCreatorOpen,
    setEditingAsset: state.setEditingAsset,
    handleCreatorCreate: state.handleCreatorCreate,
    updateAssetById: state.updateAssetById,
    setAssets: state.setAssets,
    setSelectedAssetId: state.setSelectedAssetId,
    alertFn: (message) => state.showToast(message, "warning", 3500),
    confirmFn: (message) => state.confirmUser(message),
  };

  return {
    assetPanelProps,
    initialHeight: 90,
    minHeight: 0,
    maxHeightPct: 0.7,
    assetStamp: state.assetStamp,
    setAssetStamp: state.setAssetStamp,
    naturalSettings: state.naturalSettings,
    setNaturalSettings: state.setNaturalSettings,
  };
}
