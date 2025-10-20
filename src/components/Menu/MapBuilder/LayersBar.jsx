import React from "react";
import { LAYERS } from "./utils";

const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M1 8c2.5-4 6-6 7-6s4.5 2 7 6c-2.5 4-6 6-7 6S3.5 12 1 8z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);
const EyeOffIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={className}>
    <path d="M1 8c2.5-4 6-6 7-6s4.5 2 7 6c-2.5 4-6 6-7 6S3.5 12 1 8z" fill="currentColor" opacity=".5" />
    <circle cx="8" cy="8" r="2" fill="currentColor" opacity=".5" />
    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function LayersBar({
  currentLayer,
  setCurrentLayer,
  layerVisibility,
  toggleLayerVisibility,
  tokensVisible,
  setTokensVisible,
  showAllLayers,
  hideAllLayers,
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

