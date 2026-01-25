import React from "react";
import AssetCard from "./AssetCard.jsx";
import AssetViewToggle from "./AssetViewToggle.jsx";

export default function AssetListSection({
  assets,
  showAssetPreviews,
  onToggleView,
  selectedAssetId,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mb-2 border border-gray-600 rounded overflow-hidden">
      <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
        <span className="text-xs uppercase tracking-wide">Assets</span>
        <AssetViewToggle showPreview={!!showAssetPreviews} onChange={onToggleView} />
      </div>

      <div
        className={`p-2 ${
          showAssetPreviews
            ? "grid grid-cols-2 md:grid-cols-3 gap-4"
            : "flex flex-wrap items-start gap-2"
        }`}
      >
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            isSelected={selectedAssetId === asset.id}
            showPreview={!!showAssetPreviews}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
