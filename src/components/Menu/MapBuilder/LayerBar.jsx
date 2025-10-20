import React from "react";
import { LAYERS } from "./utils";
import { EyeIcon, EyeOffIcon } from "./icons";

export default function LayerBar({
  currentLayer,
  setCurrentLayer,
  layerVisibility,
  toggleLayerVisibility,
  showAllLayers,
  hideAllLayers,
  tokensVisible,
  setTokensVisible,
}) {
  return (
    <div className="sticky top-0 left-0 right-0 z-40 bg-gray-800/80 text-white backdrop-blur px-2 py-1 border-b border-gray-700">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase opacity-80 mr-1">Layers</span>
        <button className="px-2 py-0.5 text-[12px] bg-gray-700 rounded" onClick={showAllLayers}>Show All</button>
        <button className="px-2 py-0.5 text-[12px] bg-gray-700 rounded" onClick={hideAllLayers}>Hide All</button>
        <div className="h-4 w-px bg-gray-600 mx-1" />
        {LAYERS.map((l) => (
          <div key={`layerbar-${l}`} className="flex items-center gap-1">
            <button
              onClick={() => setCurrentLayer(l)}
              className={`px-2 py-0.5 text-[12px] rounded ${currentLayer === l ? 'bg-blue-600' : 'bg-gray-700'}`}
              title={`Edit ${l}`}
            >
              {l}
            </button>
            <button
              onClick={() => toggleLayerVisibility(l)}
              className={`px-2 py-0.5 text-[12px] rounded ${layerVisibility[l] ? 'bg-gray-600' : 'bg-gray-700'}`}
              title={layerVisibility[l] ? 'Visible' : 'Hidden'}
            >
              {layerVisibility[l] ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
        ))}
        <div className="h-4 w-px bg-gray-600 mx-1" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTokensVisible((v) => !v)}
            className={`px-2 py-0.5 text-[12px] rounded flex items-center gap-1 ${tokensVisible ? 'bg-gray-600' : 'bg-gray-700'}`}
            title={tokensVisible ? 'Hide tokens layer' : 'Show tokens layer'}
          >
            <span>tokens</span>
            {tokensVisible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

