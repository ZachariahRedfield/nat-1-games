import React from "react";
import { NumericInput } from "../../../../../shared/index.js";
import LinkToggleButton from "./LinkToggleButton.jsx";

function clampGridSize(value) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

export default function LinkedSizeInputs({
  valueCols,
  valueRows,
  onCommitCols,
  onCommitRows,
  linkXY,
  onToggleLink,
  inputClassName,
  buttonClassName,
  showAxisLabels = true,
}) {
  return (
    <>
      <div className="relative">
        <NumericInput
          value={valueCols}
          min={1}
          max={100}
          step={1}
          className={inputClassName}
          onCommit={(value) => onCommitCols(clampGridSize(value))}
          title="Width in tiles (columns)"
        />
        {showAxisLabels && (
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
            X
          </span>
        )}
      </div>
      <LinkToggleButton linkXY={linkXY} onToggle={onToggleLink} className={buttonClassName} />
      <div className="relative">
        <NumericInput
          value={valueRows}
          min={1}
          max={100}
          step={1}
          className={inputClassName}
          onCommit={(value) => onCommitRows(clampGridSize(value))}
          title="Height in tiles (rows)"
        />
        {showAxisLabels && (
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
            Y
          </span>
        )}
      </div>
    </>
  );
}
