import React from "react";
import { NumericInput } from "../../../../shared/index.js";

const alphaRangeStyles = `.alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:20px; margin:0; }
.alpha-range:focus{ outline:none; }
.alpha-range::-webkit-slider-runnable-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
.alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:4px; margin-top:-2px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }
.alpha-range::-moz-range-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
.alpha-range::-moz-range-thumb{ width:16px; height:16px; border-radius:4px; background:#ffffff; border:2px solid #374151; }`;

export default function OpacitySpacingControls({
  canvasOpacity,
  setCanvasOpacity,
  canvasSpacing,
  setCanvasSpacing,
  snapshotSettings,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div>
        <label className="block text-xs mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <style>{alphaRangeStyles}</style>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={canvasOpacity}
              onChange={(e) => {
                snapshotSettings?.();
                setCanvasOpacity(parseFloat(e.target.value));
              }}
              className="alpha-range"
              aria-label="Opacity"
            />
          </div>
          <NumericInput
            value={canvasOpacity}
            min={0.05}
            max={1}
            step={0.05}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v) => {
              const n = Math.max(0.05, Math.min(1, parseFloat(v)));
              snapshotSettings?.();
              setCanvasOpacity(n);
            }}
            title="Brush opacity"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1">Spacing / Tempo</label>
        <div className="flex items-center gap-2 mb-1">
          <NumericInput
            value={canvasSpacing}
            min={0.1}
            max={5}
            step={0.05}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v) => {
              const n = Math.max(0.1, Math.min(5, parseFloat(v)));
              snapshotSettings?.();
              setCanvasSpacing(n);
            }}
            title="Spacing as a fraction of radius"
          />
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.05"
          value={canvasSpacing}
          onChange={(e) => {
            snapshotSettings?.();
            setCanvasSpacing(parseFloat(e.target.value));
          }}
          className="w-full"
        />
        <div className="text-xs text-gray-300 mt-1">
          ×{canvasSpacing.toFixed(2)} of brush radius
        </div>
      </div>
    </div>
  );
}
