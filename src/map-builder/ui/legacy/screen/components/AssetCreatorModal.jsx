import React from "react";
import AssetCreator from "../../AssetCreator.jsx";

export default function AssetCreatorModal({
  open,
  editingAsset,
  creatorKind,
  selectedAsset,
  onClose,
  onCreate,
  onUpdate,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10057] flex items-center justify-center bg-black/70 p-4">
      <div className="w-[92%] max-w-xl max-h-[85vh] overflow-hidden bg-gray-900 border border-gray-700 rounded-lg text-gray-100 shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-sm uppercase tracking-wide text-gray-200">
            {editingAsset ? "Edit Asset" : "Create Asset"}
          </div>
          <button
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(85vh-3.25rem)]">
          <AssetCreator
            kind={creatorKind}
            onClose={onClose}
            onCreate={onCreate}
            onUpdate={(updated) => {
              if (!editingAsset) return;
              onUpdate?.(updated);
            }}
            initialAsset={editingAsset}
            selectedImageSrc={selectedAsset?.kind === "image" ? selectedAsset?.src : null}
            mode={editingAsset ? "edit" : "create"}
          />
        </div>
      </div>
    </div>
  );
}
