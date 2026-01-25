import React from "react";

const saveButtonClass = (disabled) =>
  `px-3 py-1 rounded ${
    disabled ? "bg-gray-700/60 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
  }`;

export default function DialogActions({ disabled, onSave, onClose }) {
  return (
    <div className="mt-6 flex gap-2">
      <button className={saveButtonClass(disabled)} disabled={disabled} onClick={onSave}>
        Save
      </button>
      <button className="px-3 py-1 rounded bg-gray-700" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
