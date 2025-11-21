import React from "react";
import { NumericInput } from "../../../../../../shared/index.js";

export default function RandomRangeControl({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  inputClassName,
  onToggle,
  onMinCommit,
  onMaxCommit,
}) {
  const effectiveValue = value ?? defaultValue;

  return (
    <div className="text-xs">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!effectiveValue?.enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
        {label}
      </label>
      <div className="flex items-center gap-1 mt-1">
        <NumericInput
          value={effectiveValue?.min}
          min={min}
          max={max}
          step={step}
          onCommit={onMinCommit}
          className={inputClassName}
        />
        <span>to</span>
        <NumericInput
          value={effectiveValue?.max}
          min={min}
          max={max}
          step={step}
          onCommit={onMaxCommit}
          className={inputClassName}
        />
      </div>
    </div>
  );
}
