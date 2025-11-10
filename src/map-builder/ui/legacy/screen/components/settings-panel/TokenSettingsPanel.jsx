import React, { useMemo } from "react";
import { NumericInput, RotationWheel, TextCommitInput } from "../../../../../../shared/index.js";

function clamp(value, { min, max }) {
  if (typeof value !== "number") {
    value = Number(value);
  }
  const safeMin = typeof min === "number" ? min : -Infinity;
  const safeMax = typeof max === "number" ? max : Infinity;
  return Math.max(safeMin, Math.min(safeMax, value));
}

export default function TokenSettingsPanel({
  gridSettings,
  setGridSettings,
  snapshotSettings,
  updateTokenById,
  tokenHUDVisible,
  setTokenHUDVisible,
  tokenHUDShowInitiative,
  setTokenHUDShowInitiative,
  selectedToken,
}) {
  const resolvedToken = selectedToken || null;

  const glowColor = useMemo(() => {
    if (!resolvedToken) {
      return "#7dd3fc";
    }
    return resolvedToken.glowColor || "#7dd3fc";
  }, [resolvedToken]);

  if (!resolvedToken) {
    return null;
  }

  const commitGridSettings = (changes) => {
    snapshotSettings?.();
    setGridSettings?.((state) => ({ ...state, ...changes }));
  };

  const commitTokenMeta = (changes) => {
    updateTokenById?.(resolvedToken.id, {
      meta: { ...resolvedToken.meta, ...changes },
    });
  };

  const commitGlowColor = (value) => {
    updateTokenById?.(resolvedToken.id, {
      glowColor: value,
    });
  };

  return (
    <>
      <h3 className="font-bold text-sm mb-2">Token Settings</h3>
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
                onCommit={(value) => {
                  const next = clamp(Math.round(value), { min: 1, max: 100 });
                  commitGridSettings({ sizeCols: next });
                }}
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                X
              </span>
            </div>
          </div>
          <div className="inline-flex items-center">
            <div className="relative">
              <NumericInput
                value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                min={1}
                max={100}
                step={1}
                className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                onCommit={(value) => {
                  const next = clamp(Math.round(value), { min: 1, max: 100 });
                  commitGridSettings({ sizeRows: next });
                }}
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                Y
              </span>
            </div>
          </div>
        </div>
        <label className="block text-xs">Rotation</label>
        <div className="flex items-center gap-3 mb-1">
          <NumericInput
            value={gridSettings.rotation}
            min={0}
            max={359}
            step={1}
            className="w-12 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(value) => {
              const next = clamp(Math.round(value), { min: 0, max: 359 });
              commitGridSettings({ rotation: next });
            }}
          />
          <RotationWheel
            value={gridSettings.rotation}
            onChange={(value) => {
              const next = clamp(Math.round(value), { min: 0, max: 359 });
              commitGridSettings({ rotation: next });
            }}
            size={72}
          />
        </div>
        <div className="flex gap-2">
          <label className="text-xs">
            <input
              type="checkbox"
              checked={gridSettings.flipX}
              onChange={(event) => commitGridSettings({ flipX: event.target.checked })}
            />
            {" "}Flip X
          </label>
          <label className="text-xs">
            <input
              type="checkbox"
              checked={gridSettings.flipY}
              onChange={(event) => commitGridSettings({ flipY: event.target.checked })}
            />
            {" "}Flip Y
          </label>
        </div>
        <label className="block text-xs">Opacity</label>
        <div className="w-full">
          <style>
            {`.alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:24px; margin:0; }
            .alpha-range:focus{ outline:none; }
            .alpha-range::-webkit-slider-runnable-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
            .alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:4px; margin-top:-2px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }
            .alpha-range::-moz-range-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
            .alpha-range::-moz-range-thumb{ width:16px; height:16px; border-radius:4px; background:#ffffff; border:2px solid #374151; }`}
          </style>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={gridSettings.opacity}
            onChange={(event) =>
              commitGridSettings({
                opacity: parseFloat(event.target.value),
              })
            }
            className="alpha-range"
            aria-label="Opacity"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs">
            Name
            <TextCommitInput
              className="w-full p-1 text-black rounded"
              value={resolvedToken.meta?.name || ""}
              onCommit={(value) => commitTokenMeta({ name: value })}
            />
          </label>
          <label className="text-xs">
            HP
            <NumericInput
              value={resolvedToken.meta?.hp ?? 0}
              min={-9999}
              max={999999}
              step={1}
              onCommit={(value) => commitTokenMeta({ hp: Math.round(value) })}
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
          <label className="text-xs">
            Initiative
            <NumericInput
              value={resolvedToken.meta?.initiative ?? 0}
              min={-99}
              max={999}
              step={1}
              onCommit={(value) => commitTokenMeta({ initiative: Math.round(value) })}
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={tokenHUDVisible}
              onChange={(event) => setTokenHUDVisible?.(event.target.checked)}
            />
            Show Token HUD
          </label>
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={tokenHUDShowInitiative}
              onChange={(event) => setTokenHUDShowInitiative?.(event.target.checked)}
            />
            Show Initiative in HUD
          </label>
        </div>
        <div className="mt-2">
          <label className="text-xs">Glow Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={glowColor}
              onChange={(event) => commitGlowColor(event.target.value)}
              className="w-10 h-6 p-0 border border-gray-500 rounded"
              title="Token glow color"
            />
            <input
              type="text"
              className="flex-1 p-1 text-black rounded"
              value={glowColor}
              onChange={(event) => commitGlowColor(event.target.value)}
              placeholder="#7dd3fc"
            />
          </div>
        </div>
      </div>
    </>
  );
}
