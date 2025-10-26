import React from "react";
import NumericInput from "../../common/NumericInput";
import RotationWheel from "../../common/RotationWheel";
import AlphaSlider from "../../common/AlphaSlider";
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
  // Link X/Y sizes (stored in gridSettings.linkXY, defaults to false)
  const linkXY = !!(gridSettings?.linkXY);
  const toggleLinkXY = () => {
    snapshotSettings?.();
    setGridSettings((s) => ({ ...s, linkXY: !s?.linkXY }));
  };

  const LinkIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9.5 11.5h-3a3 3 0 0 1 0-6h3" strokeLinecap="round" />
    </svg>
  );
  const LinkBrokenIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9 6L10.5 4.5M7 6L5.5 4.5M9 10l1.5 1.5M7 10L5.5 11.5" strokeLinecap="round" />
    </svg>
  );
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
          <div className="flex items-end gap-3 mb-1">
            <span className="text-xs">Size</span>
            <div className="inline-flex items-center">
              <div className="relative">
                <NumericInput
                  value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                  min={1}
                  max={100}
                  step={1}
                  className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                  onCommit={(v) => {
                    const n = Math.max(1, Math.min(100, Math.round(v)));
                    snapshotSettings?.();
                    setGridSettings((s) => linkXY ? ({ ...s, sizeCols: n, sizeRows: n }) : ({ ...s, sizeCols: n }));
                  }}
                  title="Width in tiles (columns)"
                />
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleLinkXY}
              title={linkXY ? 'Linked: change one to set both' : 'Unlinked: set X and Y independently'}
              className={`mx-1 p-1 rounded border ${linkXY ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
              aria-pressed={linkXY}
            >
              {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
            </button>
            <div className="inline-flex items-center">
              <div className="relative">
                <NumericInput
                  value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                  min={1}
                  max={100}
                  step={1}
                  className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                  onCommit={(v) => {
                    const n = Math.max(1, Math.min(100, Math.round(v)));
                    snapshotSettings?.();
                    setGridSettings((s) => linkXY ? ({ ...s, sizeRows: n, sizeCols: n }) : ({ ...s, sizeRows: n }));
                  }}
                  title="Height in tiles (rows)"
                />
                <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
              </div>
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
        <div className="flex items-end gap-3 mb-1">
          <span className="text-xs">Size</span>
          <div className="inline-flex items-center">
            <div className="relative">
              <NumericInput
                value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                min={1}
                max={100}
                step={1}
                className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings?.(); setGridSettings((s) => linkXY ? ({ ...s, sizeCols: n, sizeRows: n }) : ({ ...s, sizeCols: n })); }}
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleLinkXY}
            title={linkXY ? 'Linked: change one to set both' : 'Unlinked: set X and Y independently'}
            className={`mx-1 p-1 rounded border ${linkXY ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
            aria-pressed={linkXY}
          >
            {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
          </button>
          <div className="inline-flex items-center">
            <div className="relative">
              <NumericInput
                value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                min={1}
                max={100}
                step={1}
                className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(v) => { const n = Math.max(1, Math.min(100, Math.round(v))); snapshotSettings?.(); setGridSettings((s) => linkXY ? ({ ...s, sizeRows: n, sizeCols: n }) : ({ ...s, sizeRows: n })); }}
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
            </div>
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
        <div className="flex items-center gap-3 mb-2">
          <NumericInput
            value={gridSettings.rotation}
            min={0}
            max={359}
            step={1}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v)=> { const n = Math.max(0, Math.min(359, Math.round(v))); snapshotSettings?.(); setGridSettings((s)=> ({ ...s, rotation: n })); }}
          />
          <RotationWheel
            value={gridSettings.rotation}
            onChange={(n)=> { const d = Math.max(0, Math.min(359, Math.round(n))); snapshotSettings?.(); setGridSettings((s)=> ({ ...s, rotation: d })); }}
            size={72}
          />
        </div>
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
        <AlphaSlider
          value={gridSettings.opacity}
          min={0.05}
          max={1}
          step={0.05}
          onChange={(e) => {
            snapshotSettings?.();
            setGridSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) }));
          }}
        />
      </div>
    </div>
  );
}
