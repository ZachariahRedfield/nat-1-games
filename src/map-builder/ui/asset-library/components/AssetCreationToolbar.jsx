import React, { useState } from "react";

function CreationButton({ children, onClick }) {
  return (
    <button
      type="button"
      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function AssetCreationToolbar({ onOpenCreator }) {
  const [assetKind, setAssetKind] = useState("image");
  const options = [
    { value: "image", label: "Image" },
    { value: "text", label: "Text/Label" },
    { value: "material", label: "Color" },
    { value: "natural", label: "Natural" },
    { value: "token", label: "Token" },
  ];
  const open = () => onOpenCreator?.(assetKind);

  return (
    <div className="mt-1 mb-3 flex flex-wrap items-center gap-2">
      <CreationButton onClick={open}>Create Asset</CreationButton>
      <label className="flex items-center gap-2 text-xs text-gray-300">
        <span className="uppercase tracking-wide">Type</span>
        <select
          value={assetKind}
          onChange={(event) => setAssetKind(event.target.value)}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
