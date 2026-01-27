import React from "react";
import { NumericInput } from "../../../../../shared/index.js";
import LinkToggleButton from "./LinkToggleButton.jsx";

function clampGridSize(value, snapToGrid) {
  const clamped = Math.max(1, Math.min(100, value));
  if (snapToGrid) {
    return Math.round(clamped);
  }
  return Number.parseFloat(clamped.toFixed(2));
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
  placeholderCols = "",
  placeholderRows = "",
  snapToGrid = true,
}) {
  return (
    <>
      <div className="relative">
        <NumericInput
          value={valueCols}
          min={1}
          max={100}
          step={snapToGrid ? 1 : 0.1}
          className={inputClassName}
          placeholder={placeholderCols}
          onCommit={(value) => onCommitCols(clampGridSize(value, snapToGrid))}
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
          step={snapToGrid ? 1 : 0.1}
          className={inputClassName}
          placeholder={placeholderRows}
          onCommit={(value) => onCommitRows(clampGridSize(value, snapToGrid))}
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
