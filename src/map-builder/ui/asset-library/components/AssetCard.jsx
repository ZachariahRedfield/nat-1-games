import React from "react";
import { resolvePrimaryPreview } from "../assetGrouping.js";

function AssetPreview({ asset, showPreview }) {
  const preview = resolvePrimaryPreview(asset);

  if (!showPreview) {
    return <div className="text-xs font-medium whitespace-normal break-words leading-tight py-0.5">{asset.name}</div>;
  }

  if (preview.type === "image") {
    return (
      <img
        src={preview.src || undefined}
        alt={preview.alt || asset.name}
        className="w-full h-24 md:h-28 object-contain"
      />
    );
  }

  if (preview.type === "color") {
    return <div className="w-full h-24 md:h-28 rounded" style={{ backgroundColor: preview.color }} />;
  }

  if (preview.type === "tokenGroup") {
    return (
      <div className="w-full h-24 md:h-28 flex items-center justify-center text-[10px] opacity-80">
        {preview.count || 0} tokens
      </div>
    );
  }

  if (preview.type === "emptyNatural") {
    return (
      <div className="w-full h-24 md:h-28 flex items-center justify-center text-[10px] opacity-80">
        0 variants
      </div>
    );
  }

  return (
    <div className="w-full h-24 md:h-28 flex items-center justify-center text-[10px] opacity-80">No preview</div>
  );
}

export default function AssetCard({
  asset,
  isSelected,
  showPreview,
  onSelect,
  onEdit,
  onDelete,
}) {
  if (!asset) return null;

  const baseClasses = showPreview
    ? "rounded-lg p-2 pb-2 text-xs flex flex-col border shadow-sm"
    : "p-2 text-xs rounded-lg border shadow-sm";
  const stateClasses = isSelected
    ? "border-white/90 ring-1 ring-white/70 bg-gray-700/80"
    : "border-gray-600 bg-gray-800/60 hover:bg-gray-700/60";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(asset.id)}
      onKeyPress={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(asset.id);
        }
      }}
      className={`relative cursor-pointer transition ${baseClasses} ${stateClasses}`}
      title={asset.name}
    >
      <AssetPreview asset={asset} showPreview={showPreview} />
      {showPreview && (
        <>
          <div className="mt-1 h-px bg-gray-600" />
          <div className="pt-1 truncate">{asset.name}</div>
        </>
      )}

      {isSelected && (
        showPreview ? (
          <div className="mt-1 inline-flex overflow-hidden rounded">
            <button
              type="button"
              className="px-2 py-0.5 text-[11px] bg-gray-700 hover:bg-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(asset);
              }}
              title="Edit asset"
            >
              Edit
            </button>
            <button
              type="button"
              className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(asset);
              }}
              title="Delete asset"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="absolute top-1 right-1 inline-flex overflow-hidden rounded">
            <button
              type="button"
              className="px-2 py-0.5 text-[11px] bg-gray-700 hover:bg-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(asset);
              }}
              title="Edit asset"
            >
              Edit
            </button>
            <button
              type="button"
              className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(asset);
              }}
              title="Delete asset"
            >
              Delete
            </button>
          </div>
        )
      )}
    </div>
  );
}
