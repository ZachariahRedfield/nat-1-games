export function createLayerBarProps(state) {
  return {
    currentLayer: state.currentLayer,
    setCurrentLayer: state.setCurrentLayer,
    layerVisibility: state.layerVisibility,
    toggleLayerVisibility: state.toggleLayerVisibility,
    tokensVisible: state.tokensVisible,
    setTokensVisible: state.setTokensVisible,
    showGridLines: state.showGridLines,
    setShowGridLines: state.setShowGridLines,
    tileSize: state.tileSize,
    setTileSize: state.setTileSize,
  };
}
