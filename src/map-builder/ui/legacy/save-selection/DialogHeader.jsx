import React from "react";

export default function DialogHeader({ onClose }) {
  return (
    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
      <h3 className="text-lg font-bold">Save Selection</h3>
      <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
