export function createLayerBarProps(state) {
  return {
    layers: state.layers,
    currentLayer: state.currentLayer,
    setCurrentLayer: state.setCurrentLayer,
    addLayer: state.addLayer,
    renameLayer: state.renameLayer,
    removeLayer: state.removeLayer,
    layerVisibility: state.layerVisibility,
    toggleLayerVisibility: state.toggleLayerVisibility,
    showGridLines: state.showGridLines,
    setShowGridLines: state.setShowGridLines,
    tileSize: state.tileSize,
    setTileSize: state.setTileSize,
    reorderLayer: state.reorderLayer,
    onZoomToFit: state.zoomToFit,
  };
}
