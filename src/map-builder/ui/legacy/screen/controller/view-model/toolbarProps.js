export function createToolbarProps(state) {
  const selectedObjects = state.selectedObjsList ?? [];
  const selectedTokens = state.selectedTokensList ?? [];
  const canActOnSelection = selectedObjects.length > 0 || selectedTokens.length > 0;

  return {
    interactionMode: state.interactionMode,
    zoomToolActive: state.zoomToolActive,
    panToolActive: state.panToolActive,
    setInteractionMode: state.setInteractionMode,
    setZoomToolActive: state.setZoomToolActive,
    setPanToolActive: state.setPanToolActive,
    isErasing: state.isErasing,
    setIsErasing: state.setIsErasing,
    engine: state.engine,
    setEngine: state.setEngine,
    assetGroup: state.assetGroup,
    canActOnSelection,
    onSaveSelection: state.openSaveSelectionDialog,
    onDeleteSelection: state.deleteCurrentSelection,
  };
}
