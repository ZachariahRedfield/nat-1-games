export function createDialogProps(state) {
  const assetsFolderDialogProps = {
    open: state.needsAssetsFolder && state.assetsFolderDialogOpen,
    onClose: () => state.setAssetsFolderDialogOpen(false),
    onChooseFolder: state.promptChooseAssetsFolder,
  };

  const assetCreatorModalProps = {
    open: state.creatorOpen,
    editingAsset: state.editingAsset,
    creatorKind: state.creatorKind,
    selectedAsset: state.selectedAsset,
    onClose: state.closeAssetCreator,
    onCreate: state.handleCreatorCreate,
    onUpdate: state.handleAssetUpdate,
  };

  const loadMapsModalProps = {
    open: state.loadModalOpen,
    mapsList: state.mapsList,
    onClose: state.closeLoadModal,
    onOpenMap: state.handleLoadMapFromList,
    onDeleteMap: state.handleDeleteMapFromList,
  };

  const mapSizeModalProps = {
    open: state.mapSizeModalOpen,
    rowsValue: state.rowsInput,
    colsValue: state.colsInput,
    onChangeRows: state.handleChangeRows,
    onChangeCols: state.handleChangeCols,
    onCancel: state.closeMapSizeModal,
    onApply: state.applyMapSize,
  };

  const saveSelectionDialogProps = {
    open: state.saveDialogOpen,
    onClose: state.closeSaveSelectionDialog,
    selectedObjsList: state.selectedObjsList,
    selectedTokensList: state.selectedTokensList,
    saveSelectionAsAsset: state.saveSelectionAsAsset,
    saveMultipleObjectsAsNaturalGroup: state.saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage: state.saveMultipleObjectsAsMergedImage,
    saveSelectedTokenAsAsset: state.saveSelectedTokenAsAsset,
    saveSelectedTokensAsGroup: state.saveSelectedTokensAsGroup,
  };

  return {
    assetsFolderDialogProps,
    assetCreatorModalProps,
    loadMapsModalProps,
    mapSizeModalProps,
    saveSelectionDialogProps,
  };
}
