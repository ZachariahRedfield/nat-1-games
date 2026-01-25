import React from "react";
import { NumericInput } from "../../../../shared/index.js";

export default function BrushSizeControl({
  brushSize,
  setBrushSize,
  tileSize,
  snapshotSettings,
}) {
  return (
    <div className="mt-1">
      <label className="block text-xs mb-1">Brush Size (tiles)</label>
      <div className="flex items-center gap-2">
        <NumericInput
          value={brushSize}
          min={0.1}
          max={100}
          step={0.1}
          className="w-12 px-1 py-0.5 text-xs text-black rounded"
          onCommit={(v) => {
            const n = Math.max(0.1, Math.min(100, parseFloat(v)));
            snapshotSettings?.();
            setBrushSize(n);
          }}
          title="Brush size in tiles"
        />
      </div>
      <div className="text-xs text-gray-300 mt-1">~{brushSize * tileSize}px</div>
    </div>
  );
}
