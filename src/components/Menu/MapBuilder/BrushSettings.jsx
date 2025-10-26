import React from "react";
import NumericInput from "../../common/NumericInput";
import CanvasBrushControls from "./CanvasBrushControls";

export default function BrushSettings({
  kind = 'grid', // 'grid' | 'natural' | 'canvas'
  // grid
  gridSettings,
  setGridSettings,
  // natural
  naturalSettings,
  setNaturalSettings,
  // canvas
  brushSize,
  setBrushSize,
  canvasOpacity,
  setCanvasOpacity,
  canvasSpacing,
  setCanvasSpacing,
  canvasBlendMode,
  setCanvasBlendMode,
  canvasSmoothing,
  setCanvasSmoothing,
  tileSize,
  titleOverride,
  // shared
  snapshotSettings,
}) {
  if (kind === 'canvas') {
    return (
      <div>
        <h3 className="font-bold text-sm mb-2">{titleOverride || 'Settings'}</h3>
        <CanvasBrushControls
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          canvasOpacity={canvasOpacity}
          setCanvasOpacity={setCanvasOpacity}
          canvasSpacing={canvasSpacing}
          setCanvasSpacing={setCanvasSpacing}
          canvasBlendMode={canvasBlendMode}
          setCanvasBlendMode={setCanvasBlendMode}
          canvasSmoothing={canvasSmoothing}
          setCanvasSmoothing={setCanvasSmoothing}
          tileSize={tileSize}
          snapshotSettings={snapshotSettings}
        />
      </div>
    );
  }

  if (kind === 'natural') {
    return (
      <div>
        <h3 className="font-bold text-sm mb-2">{titleOverride || 'Settings'}</h3>
        <div className="grid gap-2">
          <label className="block text-xs">Size (tiles)</label>
          <div className="flex items-center gap-3 mb-1">
            <div className="inline-flex items-center gap-1">
              <span className="text-xs">Cols (X)</span>
              <NumericInput
                value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                min={1}
                max={100}
                step={1}
                className="w-12 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(v) => {
                  const n = Math.max(1, Math.min(100, Math.round(v)));
                  snapshotSettings?.();
                  setGridSettings((s) => ({ ...s, sizeCols: n }));
                }}
                title="Width in tiles (columns)"
              />
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="text-xs">Rows (Y)</span>
              <NumericInput
                value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                min={1}
                max={100}
                step={1}
                className="w-12 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(v) => {
                  const n = Math.max(1, Math.min(100, Math.round(v)));
                  snapshotSettings?.();
                  setGridSettings((s) => ({ ...s, sizeRows: n }));
                }}
                title="Height in tiles (rows)"
              />
            </div>
          </div>
          {/* size slider removed */}

          {/* Grid Snap + Step (contained in one slim box) */}
          <div className="text-xs inline-flex items-center gap-3 px-2 py-1 border border-gray-700 rounded w-fit">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!gridSettings.snapToGrid}
                onChange={(e) => {
                  snapshotSettings?.();
                  setGridSettings((s) => ({ ...s, snapToGrid: e.target.checked }));
                }}
              />
              Grid Snap
            </label>
            {!gridSettings.snapToGrid && (
              <div className="inline-flex items-center gap-2">
                <span>Step</span>
                <NumericInput
                  value={gridSettings.snapStep ?? 1}
                  min={0.05}
                  step={0.05}
                  className="w-12 px-1 py-0.5 text-xs text-black rounded"
                  onCommit={(v) => {
                    const n = Math.max(0.05, parseFloat(v));
                    snapshotSettings?.();
                    setGridSettings((s) => ({ ...s, snapStep: n }));
                  }}
                  title="Used when Grid Snap is off"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={naturalSettings?.randomRotation || false}
                onChange={(e) => {
                  snapshotSettings?.();
                  setNaturalSettings((s) => ({ ...s, randomRotation: e.target.checked }));
                }}
              />
              Random Rotation
            </label>
            <label className="text-xs inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={naturalSettings?.randomVariant || false}
                onChange={(e) => {
                  snapshotSettings?.();
                  setNaturalSettings((s) => ({ ...s, randomVariant: e.target.checked }));
                }}
              />
              Random Variant
            </label>
            <label className="text-xs inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={naturalSettings?.randomFlipX || false}
                onChange={(e) => {
                  snapshotSettings?.();
                  setNaturalSettings((s) => ({ ...s, randomFlipX: e.target.checked }));
                }}
              />
              Random Flip X
            </label>
            <label className="text-xs inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={naturalSettings?.randomFlipY || false}
                onChange={(e) => {
                  snapshotSettings?.();
                  setNaturalSettings((s) => ({ ...s, randomFlipY: e.target.checked }));
                }}
              />
              Random Flip Y
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!naturalSettings?.randomSize?.enabled}
                  onChange={(e) => {
                    snapshotSettings?.();
                    setNaturalSettings((s) => ({
                      ...s,
                      randomSize: { ...(s.randomSize || { min: 1, max: 1 }), enabled: e.target.checked },
                    }));
                  }}
                />
                Random Size
              </label>
              <div className="flex items-center gap-1 mt-1">
                <NumericInput
                  value={naturalSettings?.randomSize?.min ?? 1}
                  min={1}
                  max={20}
                  step={1}
                  onCommit={(v) => { const n = Math.round(v); snapshotSettings?.(); setNaturalSettings((s) => ({ ...s, randomSize: { ...(s.randomSize || { enabled: false, max: 1 }), min: n } })); }}
                  className="w-12 p-1 text-black rounded"
                />
                <span>to</span>
                <NumericInput
                  value={naturalSettings?.randomSize?.max ?? 1}
                  min={1}
                  max={20}
                  step={1}
                  onCommit={(v) => { const n = Math.round(v); snapshotSettings?.(); setNaturalSettings((s) => ({ ...s, randomSize: { ...(s.randomSize || { enabled: false, min: 1 }), max: n } })); }}
                  className="w-12 p-1 text-black rounded"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!naturalSettings?.randomOpacity?.enabled}
                  onChange={(e) => {
                    snapshotSettings?.();
                    setNaturalSettings((s) => ({
                      ...s,
                      randomOpacity: { ...(s.randomOpacity || { min: 1, max: 1 }), enabled: e.target.checked },
                    }));
                  }}
                />
                Random Opacity
              </label>
              <div className="flex items-center gap-1 mt-1">
                <NumericInput
                  value={naturalSettings?.randomOpacity?.min ?? 1}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onCommit={(v) => { const n = Math.max(0.05, Math.min(1, parseFloat(v))); snapshotSettings?.(); setNaturalSettings((s) => ({ ...s, randomOpacity: { ...(s.randomOpacity || { enabled: false, max: 1 }), min: n } })); }}
                  className="w-14 p-1 text-black rounded"
                />
                <span>to</span>
                <NumericInput
                  value={naturalSettings?.randomOpacity?.max ?? 1}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onCommit={(v) => { const n = Math.max(0.05, Math.min(1, parseFloat(v))); snapshotSettings?.(); setNaturalSettings((s) => ({ ...s, randomOpacity: { ...(s.randomOpacity || { enabled: false, min: 1 }), max: n } })); }}
                  className="w-14 p-1 text-black rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default: grid
  return (
    <div>
      <h3 className="font-bold text-sm mb-2">{titleOverride || 'Settings'}</h3>
      <div className="grid gap-2">
        <label className="block text-xs">Size (tiles)</label>
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex items-center gap-1">
            <span className="text-xs">Cols (X)</span>
            <NumericInput
              value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
              min={1}
              max={100}
              step={1}
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
              onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings?.(); setGridSettings((s) => ({ ...s, sizeCols: n })); }}
            />
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-xs">Rows (Y)</span>
            <NumericInput
              value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
              min={1}
              max={100}
              step={1}
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
              onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings?.(); setGridSettings((s) => ({ ...s, sizeRows: n })); }}
            />
          </div>
        </div>
        {/* size slider removed */}
        <div className="text-xs inline-flex items-center gap-3 px-2 py-1 border border-gray-700 rounded w-fit">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!gridSettings.snapToGrid} onChange={(e)=>{ snapshotSettings?.(); setGridSettings((s)=> ({ ...s, snapToGrid: e.target.checked })); }} />
            Grid Snap
          </label>
          {!gridSettings.snapToGrid && (
            <div className="inline-flex items-center gap-2">
              <span>Step</span>
              <NumericInput
                value={gridSettings.snapStep ?? 1}
                min={0.05}
                step={0.05}
                className="w-12 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(v)=> { const n = Math.max(0.05, parseFloat(v)); snapshotSettings?.(); setGridSettings((s)=> ({ ...s, snapStep: n })); }}
                title="Used when Grid Snap is off"
              />
            </div>
          )}
        </div>
        <label className="block text-xs">Rotation</label>
        <div className="flex items-center gap-2 mb-1">
          <NumericInput
            value={gridSettings.rotation}
            min={0}
            max={359}
            step={1}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v)=> { const n = Math.max(0, Math.min(359, Math.round(v))); snapshotSettings?.(); setGridSettings((s)=> ({ ...s, rotation: n })); }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="359"
          value={gridSettings.rotation}
          onChange={(e) => {
            snapshotSettings?.();
            setGridSettings((s) => ({ ...s, rotation: parseInt(e.target.value) }));
          }}
        />
        <div className="flex gap-2">
          <label className="text-xs">
            <input
              type="checkbox"
              checked={gridSettings.flipX}
              onChange={(e) => {
                snapshotSettings?.();
                setGridSettings((s) => ({ ...s, flipX: e.target.checked }));
              }}
            />{" "}
            Flip X
          </label>
          <label className="text-xs">
            <input
              type="checkbox"
              checked={gridSettings.flipY}
              onChange={(e) => {
                snapshotSettings?.();
                setGridSettings((s) => ({ ...s, flipY: e.target.checked }));
              }}
            />{" "}
            Flip Y
          </label>
        </div>
        <label className="block text-xs">Opacity</label>
        <div className="flex items-center gap-2 mb-1">
          <NumericInput
            value={gridSettings.opacity}
            min={0.05}
            max={1}
            step={0.05}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v)=> { const n = Math.max(0.05, Math.min(1, parseFloat(v))); snapshotSettings?.(); setGridSettings((s)=> ({ ...s, opacity: n })); }}
          />
        </div>
        <input
          className="w-full"
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={gridSettings.opacity}
          onChange={(e) => {
            snapshotSettings?.();
            setGridSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) }));
          }}
        />
      </div>
    </div>
  );
}
