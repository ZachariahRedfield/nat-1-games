import React from "react";
import { NumericInput, AlphaSlider } from "../../../../shared/index.js";

const clampOpacity = (value) => {
  const numeric = parseFloat(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(1, Math.max(0.05, numeric));
};

export default function SelectionPanelOpacityControls({ opacity, onChange, width }) {
  const value = clampOpacity(opacity);

  const handleNumericCommit = (next) => {
    const clamped = clampOpacity(next);
    onChange?.(clamped);
  };

  const handleSliderChange = (event) => {
    const clamped = clampOpacity(event.target.value);
    onChange?.(clamped);
  };

  return (
    <div className="absolute" style={{ left: 6, bottom: 2, width }}>
      <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-full">
        <div className="inline-flex items-center">
          <NumericInput
            value={value}
            min={0.05}
            max={1}
            step={0.05}
            className="w-10 px-1 py-0.5 text-[11px] text-black rounded"
            onCommit={handleNumericCommit}
            title="Opacity"
          />
        </div>
        <div className="flex-1" style={{ minWidth: 140 }}>
          <AlphaSlider
            value={value}
            min={0.05}
            max={1}
            step={0.05}
            onChange={handleSliderChange}
            ariaLabel="Opacity"
          />
        </div>
      </div>
    </div>
  );
}
