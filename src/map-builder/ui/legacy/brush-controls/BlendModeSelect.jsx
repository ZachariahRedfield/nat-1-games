import React from "react";

const blendModeOptions = [
  { value: "source-over", label: "source-over (normal)" },
  { value: "multiply", label: "multiply" },
  { value: "screen", label: "screen" },
  { value: "overlay", label: "overlay" },
  { value: "darken", label: "darken" },
  { value: "lighten", label: "lighten" },
  { value: "color-dodge", label: "color-dodge" },
  { value: "color-burn", label: "color-burn" },
  { value: "hard-light", label: "hard-light" },
  { value: "soft-light", label: "soft-light" },
  { value: "difference", label: "difference" },
  { value: "exclusion", label: "exclusion" },
  { value: "hue", label: "hue" },
  { value: "saturation", label: "saturation" },
  { value: "color", label: "color" },
  { value: "luminosity", label: "luminosity" },
];

export default function BlendModeSelect({
  canvasBlendMode,
  setCanvasBlendMode,
  snapshotSettings,
}) {
  return (
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
        {blendModeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
