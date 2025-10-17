import React from "react";

export default function MapStatus({ selectedAsset, engine, currentLayer, layerVisibility }) {
  return (
    <div className="mt-auto p-3 text-xs text-gray-300 border-t border-gray-700">
      <div>
        Asset: <span className="text-white">{selectedAsset?.name}</span>
      </div>
      <div>
        Engine: <span className="text-white">{engine}</span>
      </div>
      <div>
        Layer: <span className="text-white">{currentLayer}{!layerVisibility[currentLayer] ? " (hidden/locked)" : ""}</span>
      </div>
    </div>
  );
}

