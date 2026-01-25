import React from "react";
import { FitToScreenIcon } from "../icons/FitToScreenIcon.jsx";
import { normalizeTileSize } from "../utils/normalizeTileSize.js";

export function LayerBarZoomControls({ tileSize, setTileSize, onZoomToFit, snapToGrid, onToggleSnap }) {
  const handleZoomChange = React.useCallback(
    (event) => {
      setTileSize(normalizeTileSize(event.target.value));
    },
    [setTileSize],
  );

  return (
    <div id="layer-bar-zoom-controls" className="ml-auto flex items-center gap-2">
      <label className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-white/80">
        <input
          type="checkbox"
          checked={!!snapToGrid}
          onChange={onToggleSnap}
          className="h-3 w-3 rounded border-white/60 bg-transparent text-white"
        />
        Snap
      </label>
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
