import React from "react";
import { ASSET_GROUPS } from "../assetGrouping.js";

const GROUP_OPTIONS = [
  { id: ASSET_GROUPS.IMAGE, label: "Image" },
  { id: ASSET_GROUPS.TOKEN, label: "Token" },
  { id: ASSET_GROUPS.NATURAL, label: "Natural" },
];

export default function AssetGroupSelector({ activeGroup, onSelectGroup }) {
  return (
    <div className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded flex flex-wrap gap-2 justify-center">
      {GROUP_OPTIONS.map((option) => {
        const selected = activeGroup === option.id;
        const baseClasses = "px-2 py-0.5 text-sm rounded-full border border-white/90";
        const stateClasses = selected
          ? "text-white font-semibold"
          : "text-gray-400 hover:text-gray-200";
        return (
          <button
            key={option.id}
            type="button"
            className={`${baseClasses} ${stateClasses}`}
            onClick={() => onSelectGroup?.(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
