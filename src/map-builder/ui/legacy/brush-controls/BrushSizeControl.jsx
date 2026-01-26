import React from "react";
import { NumericInput } from "../../../../shared/index.js";

export default function BrushSizeControl({
  brushSize,
  setBrushSize,
  tileSize,
  snapshotSettings,
}) {
  const updateBrushSize = (value) => {
    const n = Math.max(0.01, Math.min(100, parseFloat(value)));
    if (Number.isNaN(n)) return;
    snapshotSettings?.();
    setBrushSize(n);
  };

  return (
    <div className="mt-1">
      <label className="block text-xs mb-1">Brush Size (tiles)</label>
      <div className="flex items-center gap-2">
        <NumericInput
          value={brushSize}
          min={0.01}
          max={100}
          step={0.01}
          className="w-12 px-1 py-0.5 text-xs text-black rounded"
          onCommit={updateBrushSize}
          title="Brush size in tiles"
        />
        <input
          className="flex-1 h-2 accent-sky-400"
          type="range"
          min={0.01}
          max={100}
          step={0.01}
          value={brushSize}
          onChange={(event) => updateBrushSize(event.target.value)}
          aria-label="Brush size"
        />
      </div>
      <div className="text-xs text-gray-300 mt-1">~{brushSize * tileSize}px</div>
    </div>
  );
}
