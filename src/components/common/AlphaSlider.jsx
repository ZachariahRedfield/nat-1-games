import React from "react";

export default function AlphaSlider({
  value = 1,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className = "",
  ariaLabel = "Opacity",
}) {
  const css = `
  .alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:24px; margin:0; }
  .alpha-range:focus{ outline:none; }
  .alpha-range::-webkit-slider-runnable-track{ height:12px; border-radius:2px;
    background-color:#e5e7eb;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)),
      linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
      linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
    background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px;
    background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0px;
  }
  .alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:4px; margin-top:-2px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }

  /* Firefox */
  .alpha-range::-moz-range-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image:
      linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)),
      linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
      linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
    background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px;
    background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0px; }
  .alpha-range::-moz-range-thumb{ width:16px; height:16px; border-radius:4px; background:#ffffff; border:2px solid #374151; }
  `;

  return (
    <div className={className}>
      <style>{css}</style>
      <input
        className="alpha-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    </div>
  );
}
