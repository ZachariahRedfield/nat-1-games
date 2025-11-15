import React from "react";
import { NumericInput, RotationWheel } from "../../../../shared/index.js";

const clampDegrees = (value) => {
  const next = Math.round(Number.isFinite(value) ? value : 0);
  if (next < 0) return 0;
  if (next > 359) return 359;
  return next;
};

const computeDelta = (current, next) => {
  const cur = Math.round(current ?? 0);
  const normalizedNext = clampDegrees(next);
  return ((normalizedNext - cur + 540) % 360) - 180;
};

export default function SelectionPanelRotationControls({ rotation, onRotate, wheelSize }) {
  const current = Math.round(rotation ?? 0);

  const handleNumericCommit = (value) => {
    const delta = computeDelta(current, value);
    onRotate?.(delta);
  };

  const handleWheelChange = (angle) => {
    let delta = Math.round(angle) - current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    onRotate?.(delta);
  };

  return (
    <div className="absolute" style={{ right: 6, top: 10, width: wheelSize }}>
      <div className="w-full flex justify-center mb-1">
        <div className="text-xs inline-flex items-center px-1 py-0.5 border border-white rounded-none w-fit">
          <NumericInput
            value={current}
            min={0}
            max={359}
            step={1}
            className="w-10 px-1 py-0.5 text-[11px] text-black rounded"
            onCommit={handleNumericCommit}
            title="Rotation (degrees)"
          />
        </div>
      </div>
      <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
        <RotationWheel value={current} size={wheelSize} onChange={handleWheelChange} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] text-gray-300">
          Rotation
        </div>
      </div>
    </div>
  );
}
