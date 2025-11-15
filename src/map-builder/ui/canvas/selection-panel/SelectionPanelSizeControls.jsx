import React, { useMemo } from "react";
import { NumericInput } from "../../../../shared/index.js";

const clampTiles = (value) => Math.max(1, Math.round(value ?? 1));

function LinkIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9.5 11.5h-3a3 3 0 0 1 0-6h3" strokeLinecap="round" />
    </svg>
  );
}

function LinkBrokenIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9 6L10.5 4.5M7 6L5.5 4.5M9 10l1.5 1.5M7 10L5.5 11.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SelectionPanelSizeControls({ obj, linkXY, onToggleLink, onCommit }) {
  const { widthTiles, heightTiles } = useMemo(
    () => ({
      widthTiles: clampTiles(obj?.wTiles),
      heightTiles: clampTiles(obj?.hTiles),
    }),
    [obj?.hTiles, obj?.wTiles],
  );

  const commitWidth = (value) => {
    const next = clampTiles(value);
    if (linkXY) onCommit(next, next);
    else onCommit(next, heightTiles);
  };

  const commitHeight = (value) => {
    const next = clampTiles(value);
    if (linkXY) onCommit(next, next);
    else onCommit(widthTiles, next);
  };

  const linkTitle = linkXY
    ? "Linked: change one to set both"
    : "Unlinked: set X and Y independently";

  return (
    <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit mb-2">
      <div className="relative">
        <NumericInput
          value={widthTiles}
          min={1}
          max={100}
          step={1}
          className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
          onCommit={commitWidth}
          title="Cols (tiles)"
        />
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
      </div>
      <button
        type="button"
        onClick={onToggleLink}
        title={linkTitle}
        className={`p-1 rounded border ${
          linkXY
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
        }`}
        aria-pressed={linkXY}
      >
        {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
      </button>
      <div className="relative">
        <NumericInput
          value={heightTiles}
          min={1}
          max={100}
          step={1}
          className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
          onCommit={commitHeight}
          title="Rows (tiles)"
        />
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
      </div>
    </div>
  );
}
