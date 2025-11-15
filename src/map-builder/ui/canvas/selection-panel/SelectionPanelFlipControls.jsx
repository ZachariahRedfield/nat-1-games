import React from "react";

export default function SelectionPanelFlipControls({ onFlipX, onFlipY }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit">
        <button
          type="button"
          className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          onClick={onFlipX}
          title="Flip X"
        >
          FX
        </button>
        <button
          type="button"
          className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          onClick={onFlipY}
          title="Flip Y"
        >
          FY
        </button>
      </div>
    </div>
  );
}
