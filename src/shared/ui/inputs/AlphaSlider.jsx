import React from "react";

export default function AlphaSlider({
  value = 1,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className = "",
  ariaLabel = "Opacity",
  // Customization for size and check pattern darkness
  trackHeight = 12, // px
  thumbSize = 16, // px
  checkerColor = "#cbd5e1",
  trackBgColor = "#e5e7eb",
  checkerSize = 8, // px
}) {
  const marginTop = Math.round((trackHeight - thumbSize) / 2); // center thumb on track
  const css = `
  .alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:${24}px; margin:0; }
  .alpha-range:focus{ outline:none; }
  .alpha-range::-webkit-slider-runnable-track{ height:${trackHeight}px; border-radius:2px;
    background-color:${trackBgColor};
    background-image:
      linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0)),
      linear-gradient(45deg, ${checkerColor} 25%, transparent 25%),
      linear-gradient(-45deg, ${checkerColor} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${checkerColor} 75%),
      linear-gradient(-45deg, transparent 75%, ${checkerColor} 75%);
    background-size: auto, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px;
    background-position: 0 0, 0 0, 0 ${Math.floor(checkerSize/2)}px, ${Math.floor(checkerSize/2)}px -${Math.floor(checkerSize/2)}px, -${Math.floor(checkerSize/2)}px 0px;
  }
  .alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:${thumbSize}px; height:${thumbSize}px; border-radius:4px; margin-top:${marginTop}px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }

  /* Firefox */
  .alpha-range::-moz-range-track{ height:${trackHeight}px; border-radius:2px; background-color:${trackBgColor}; background-image:
      linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0)),
      linear-gradient(45deg, ${checkerColor} 25%, transparent 25%),
      linear-gradient(-45deg, ${checkerColor} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${checkerColor} 75%),
      linear-gradient(-45deg, transparent 75%, ${checkerColor} 75%);
    background-size: auto, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px, ${checkerSize}px ${checkerSize}px;
    background-position: 0 0, 0 0, 0 ${Math.floor(checkerSize/2)}px, ${Math.floor(checkerSize/2)}px -${Math.floor(checkerSize/2)}px, -${Math.floor(checkerSize/2)}px 0px; }
  .alpha-range::-moz-range-thumb{ width:${thumbSize}px; height:${thumbSize}px; border-radius:4px; background:#ffffff; border:2px solid #374151; }
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
