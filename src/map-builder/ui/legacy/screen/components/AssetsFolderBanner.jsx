import React from "react";

export default function AssetsFolderBanner({ needsAssetsFolder, onChooseFolder }) {
  if (!needsAssetsFolder) return null;

  return (
    <div className="bg-amber-800 text-amber-100 border-b border-amber-600 px-4 py-2 flex items-center justify-between">
      <div className="text-sm">
        Select an Assets folder to enable saving/loading assets across projects.
      </div>
      <button
        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs"
        onClick={onChooseFolder}
      >
        Choose Assets Folder
      </button>
    </div>
  );
}
