import React from "react";
import MapStatus from "../../MapStatus.jsx";
import CanvasBrushSettingsPanel from "./settings-panel/CanvasBrushSettingsPanel.jsx";
import SelectionSettingsPanel from "./settings-panel/SelectionSettingsPanel.jsx";

export default function LegacySettingsPanel(props) {
  const { panToolActive, zoomToolActive, selectedAsset, engine, currentLayer, layerVisibility } = props;

  if (panToolActive || zoomToolActive) {
    return (
      <div className="hidden" aria-hidden="true">
        <div className="p-4 space-y-5 overflow-y-auto">
          <MapStatus
            selectedAsset={selectedAsset}
            engine={engine}
            currentLayer={currentLayer}
            layerVisibility={layerVisibility}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden" aria-hidden="true">
      <div className="p-4 space-y-5 overflow-y-auto">
        <SelectionSettingsPanel {...props} />
        <CanvasBrushSettingsPanel {...props} />
        <MapStatus
          selectedAsset={selectedAsset}
          engine={engine}
          currentLayer={currentLayer}
          layerVisibility={layerVisibility}
        />
      </div>
    </div>
  );
}
