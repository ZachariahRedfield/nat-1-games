import React from "react";

export default function AssetsFolderDialog({ open, onClose, onChooseFolder }) {
  if (!open) return null;

  const handleClose = () => {
    onClose?.();
  };

  const handleChoose = () => {
    onChooseFolder?.();
  };

  return (
    <div className="fixed inset-0 z-[10070] flex items-center justify-center bg-black/60 pointer-events-auto">
      <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100 shadow-lg">
        <div className="font-semibold text-base mb-2">Choose an Assets Folder</div>
        <p className="text-sm text-gray-200 mb-4">
          Select a folder to store shared assets so you can save and reuse them across your
          projects.
        </p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={handleClose}>
            Not Now
          </button>
          <button
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
            onClick={handleChoose}
          >
            Choose Folder
          </button>
        </div>
      </div>
    </div>
  );
}
