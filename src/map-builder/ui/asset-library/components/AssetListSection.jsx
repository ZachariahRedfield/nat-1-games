import React from "react";
import AssetCard from "./AssetCard.jsx";
import AssetViewToggle from "./AssetViewToggle.jsx";

export default function AssetListSection({
  assets,
  showAssetPreviews,
  onToggleView,
  selectedAssetId,
  onSelect,
  onDelete,
}) {
  return (
    <div className="mb-2 border border-gray-600 rounded overflow-hidden resize-y min-h-[240px] max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
        <span className="text-xs uppercase tracking-wide">Assets</span>
        <AssetViewToggle showPreview={!!showAssetPreviews} onChange={onToggleView} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {showAssetPreviews ? (
          <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isSelected={selectedAssetId === asset.id}
                showPreview={!!showAssetPreviews}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,100px)_minmax(0,80px)] gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-700">
              <span>Name</span>
              <span>Tag</span>
              <span>Size</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-800">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssetId === asset.id}
                  showPreview={!!showAssetPreviews}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
              {assets.length === 0 && (
                <div className="px-2 py-3 text-xs text-gray-400">No assets available.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
