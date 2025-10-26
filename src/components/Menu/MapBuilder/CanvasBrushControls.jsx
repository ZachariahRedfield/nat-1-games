import React from "react";
import NumericInput from "../../common/NumericInput";

export default function CanvasBrushControls({
  brushSize,
  setBrushSize,
  canvasOpacity,
  setCanvasOpacity,
  canvasSpacing,
  setCanvasSpacing,
  canvasBlendMode = "source-over",
  setCanvasBlendMode,
  canvasSmoothing = 0.55,
  setCanvasSmoothing,
  tileSize,
  snapshotSettings,
}) {
  return (
    <div>

      {/* Brush Size */}
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

      {/* Opacity / spacing (tempo) */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <label className="block text-xs mb-1">Opacity</label>
          <div className="flex items-center gap-2">
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
              className="flex-1"
            />
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
          <div className="text-xs text-gray-300 mt-1">×{canvasSpacing.toFixed(2)} of brush radius</div>
        </div>
      </div>

      {/* Smoothing */}
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
        <div className="text-xs text-gray-300 mt-1">EMA alpha: {canvasSmoothing.toFixed(2)}</div>
      </div>

      {/* Blend Mode */}
      <div className="mt-3">
        <label className="block text-xs mb-1">Blend Mode</label>
        <select
          className="w-full bg-gray-700 text-white text-xs rounded p-1"
          value={canvasBlendMode}
          onChange={(e) => {
            snapshotSettings?.();
            setCanvasBlendMode?.(e.target.value);
          }}
        >
          {/* Common 2D canvas composite modes */}
          <option value="source-over">source-over (normal)</option>
          <option value="multiply">multiply</option>
          <option value="screen">screen</option>
          <option value="overlay">overlay</option>
          <option value="darken">darken</option>
          <option value="lighten">lighten</option>
          <option value="color-dodge">color-dodge</option>
          <option value="color-burn">color-burn</option>
          <option value="hard-light">hard-light</option>
          <option value="soft-light">soft-light</option>
          <option value="difference">difference</option>
          <option value="exclusion">exclusion</option>
          <option value="hue">hue</option>
          <option value="saturation">saturation</option>
          <option value="color">color</option>
          <option value="luminosity">luminosity</option>
        </select>
      </div>
    </div>
  );
}
