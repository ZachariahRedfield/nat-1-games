import React from "react";
import { SaveIcon } from "./icons.jsx";
import { primaryButtonClass, tooltipClass } from "./styles.js";

export default function SaveContextControl({ canSave, onSaveClick }) {
  return (
    <button
      onClick={onSaveClick}
      disabled={!canSave}
      className={primaryButtonClass(canSave)}
      title="Save selected as a new asset"
      aria-label="Save"
    >
      <span className="inline-flex items-center gap-1">
        <SaveIcon className="w-2 h-2" />
        <span className="text-[8px]">Save</span>
      </span>
      <div className={tooltipClass}>Save</div>
    </button>
  );
}
