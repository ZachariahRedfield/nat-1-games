import React from "react";
import { FitToScreenIcon } from "../icons/FitToScreenIcon.jsx";
import { normalizeTileSize } from "../utils/normalizeTileSize.js";

export function LayerBarZoomControls({ tileSize, setTileSize, onZoomToFit }) {
  const handleZoomChange = React.useCallback(
    (event) => {
      setTileSize(normalizeTileSize(event.target.value));
    },
    [setTileSize],
  );

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        className={`p-1 rounded-full border border-white/60 text-white/80 hover:text-white hover:border-white transition ${
          onZoomToFit ? "" : "opacity-40 cursor-not-allowed"
        }`}
        onClick={() => {
          if (!onZoomToFit) return;
          onZoomToFit();
        }}
        title="Fit map to view"
        disabled={!onZoomToFit}
      >
        <FitToScreenIcon />
      </button>
      <span className="text-[11px] opacity-80">Zoom</span>
      <input
        type="range"
        min="8"
        max="128"
        step="2"
        value={tileSize}
        onChange={handleZoomChange}
        title="Zoom level"
      />
      <span className="text-[11px] w-10 text-right">
        {Math.round((tileSize / 32) * 100)}%
      </span>
    </div>
  );
}
