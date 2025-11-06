import React from "react";

export default function ZoomSlider({ tileSize, setTileSize }) {
  return (
    <div className="mt-3">
      <label className="block text-xs mb-1">Zoom</label>
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => setTileSize((s) => Math.max(8, s - 4))}>-</button>
        <input type="range" min="8" max="128" step="4" value={tileSize} onChange={(e) => setTileSize(parseInt(e.target.value) || 32)} className="flex-1" />
        <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => setTileSize((s) => Math.min(128, s + 4))}>+</button>
        <div className="text-xs w-12 text-right">{Math.round((tileSize / 32) * 100)}%</div>
      </div>
    </div>
  );
}

