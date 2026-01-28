export function createToolbarProps(state) {
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
  };
}
