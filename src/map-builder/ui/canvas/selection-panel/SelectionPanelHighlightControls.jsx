import React from "react";

export default function SelectionPanelHighlightControls({ color, onChange }) {
  if (typeof color !== "string" || typeof onChange !== "function") {
    return null;
  }

  return (
    <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit mb-3">
      <span>Highlight</span>
      <input
        type="color"
        value={color}
        onChange={(event) => onChange(event.target.value)}
        className="w-8 h-5 p-0 border border-gray-500 rounded"
        title="Highlight color"
      />
      <input
        type="text"
        className="w-24 p-1 text-black rounded"
        value={color}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#7dd3fc"
      />
    </div>
  );
}
