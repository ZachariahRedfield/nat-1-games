import React from "react";

export default function AssetViewToggle({ showPreview, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] opacity-80">View:</span>
      <div className="inline-flex items-center bg-gray-800 rounded overflow-hidden border border-gray-700">
        <button
          type="button"
          className={`text-xs px-2 py-0.5 ${showPreview ? "bg-blue-600 text-white" : "bg-transparent text-gray-200"}`}
          onClick={() => onChange?.(true)}
          title="Show image thumbnails"
        >
          Images
        </button>
        <button
          type="button"
          className={`text-xs px-2 py-0.5 ${!showPreview ? "bg-blue-600 text-white" : "bg-transparent text-gray-200"}`}
          onClick={() => onChange?.(false)}
          title="Show names list"
        >
          Names
        </button>
      </div>
    </div>
  );
}
