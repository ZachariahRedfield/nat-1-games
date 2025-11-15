import { useLayerBarState } from "./hooks/useLayerBarState.js";
import { LayerBarView } from "./components/LayerBarView.jsx";

export default function LayerBarContainer(props) {
  const layerBarState = useLayerBarState({
    layers: props.layers,
    currentLayer: props.currentLayer,
    layerVisibility: props.layerVisibility,
    renameLayer: props.renameLayer,
    removeLayer: props.removeLayer,
    addLayer: props.addLayer,
    reorderLayer: props.reorderLayer,
  });

  return (
    <LayerBarView
      currentLayer={props.currentLayer}
      setCurrentLayer={props.setCurrentLayer}
      layerVisibility={props.layerVisibility}
      toggleLayerVisibility={props.toggleLayerVisibility}
      showGridLines={props.showGridLines}
      setShowGridLines={props.setShowGridLines}
      tileSize={props.tileSize}
      setTileSize={props.setTileSize}
      onZoomToFit={props.onZoomToFit}
      {...layerBarState}
    />
  );
}
