import React from "react";
import { NumericInput } from "../../../../shared/index.js";

export default function SmoothingControl({
  canvasSmoothing,
  setCanvasSmoothing,
  snapshotSettings,
}) {
  return (
    <div className="mt-3">
      <label className="block text-xs mb-1">Smoothing</label>
      <input
        type="range"
        min="0.05"
        max="0.95"
        step="0.01"
        value={canvasSmoothing}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          snapshotSettings?.();
          setCanvasSmoothing?.(v);
        }}
        className="w-full"
      />
      <div className="mt-1">
        <NumericInput
          value={canvasSmoothing}
          min={0.05}
          max={0.95}
          step={0.01}
          className="w-12 px-1 py-0.5 text-xs text-black rounded"
          onCommit={(v) => {
            const n = Math.max(0.05, Math.min(0.95, parseFloat(v)));
            snapshotSettings?.();
            setCanvasSmoothing?.(n);
          }}
          title="EMA alpha"
        />
      </div>
      <div className="text-xs text-gray-300 mt-1">
        EMA alpha: {canvasSmoothing.toFixed(2)}
      </div>
    </div>
  );
}
