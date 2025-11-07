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
    <div className="fixed inset-0 z-[10057] flex items-center justify-center bg-black/60">
      <div className="w-[96%] max-w-2xl max-h-[86vh] overflow-auto bg-gray-900 border border-gray-700 rounded text-gray-100">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <div className="font-semibold">{editingAsset ? "Edit Asset" : "Create Asset"}</div>
          <button
            className="px-2 py-1 text-xs bg-gray-700 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-3">
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
