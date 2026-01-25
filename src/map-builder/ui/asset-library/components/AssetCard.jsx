import React, { useMemo } from "react";
import { resolvePrimaryPreview } from "../assetGrouping.js";

function AssetPreview({ asset, showPreview, preview }) {
  const resolvedPreview = preview ?? resolvePrimaryPreview(asset);

  if (!showPreview) {
    return <div className="text-xs font-medium whitespace-normal break-words leading-tight py-0.5">{asset.name}</div>;
  }

  if (resolvedPreview.type === "image") {
    return (
      <img
        src={resolvedPreview.src || undefined}
        alt={resolvedPreview.alt || asset.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  if (resolvedPreview.type === "naturalStack") {
    const items = Array.isArray(resolvedPreview.items) ? resolvedPreview.items : [];
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[86%] h-[86%]">
          {items.map((item, index) => {
            const depth = items.length - index - 1;
            const offset = depth * 6;
            return (
              <img
                key={`${item.src || "variant"}-${index}`}
                src={item.src || undefined}
                alt={item.alt || resolvedPreview.alt || asset.name}
                className="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
                style={{ transform: `translate(${-offset}px, ${-offset}px)` }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (resolvedPreview.type === "color") {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: resolvedPreview.color, borderRadius: "inherit" }}
      />
    );
  }

  if (resolvedPreview.type === "tokenGroup") {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/80 bg-slate-900/60 backdrop-blur-sm">
        {resolvedPreview.count || 0} tokens
      </div>
    );
  }

  if (resolvedPreview.type === "emptyNatural") {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/80 bg-slate-900/60 backdrop-blur-sm">
        0 variants
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white/80 bg-slate-900/60 backdrop-blur-sm">
      No preview
    </div>
  );
}

export default function AssetCard({ asset, isSelected, showPreview, onSelect, onDelete }) {
  if (!asset) return null;

  const preview = useMemo(() => resolvePrimaryPreview(asset), [asset]);

  const previewBaseClasses =
    "group relative w-2/3 mx-auto aspect-square overflow-hidden rounded-xl border shadow-sm transition";
  const previewStateClasses = isSelected
    ? "border-white/70 ring-1 ring-white/40"
    : "border-white/10 hover:border-white/30";
  const nameBaseClasses =
    "relative inline-flex h-full min-w-[160px] max-w-[220px] flex-col items-stretch gap-2 px-2 py-2 text-xs rounded-lg border shadow-sm transition";
  const nameStateClasses = isSelected
    ? "border-white/90 ring-1 ring-white/70 bg-gray-700/80"
    : "border-gray-600 bg-gray-800/60 hover:bg-gray-700/60";

  const handleKeyPress = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(asset.id);
    }
  };

  if (showPreview) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(asset.id)}
        onKeyPress={handleKeyPress}
        className={`relative cursor-pointer transition ${previewBaseClasses} ${previewStateClasses}`}
        title={asset.name}
      >
        <AssetPreview asset={asset} showPreview={showPreview} preview={preview} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        <div className="pointer-events-none absolute top-1 left-1 max-w-[70%]">
          <span className="inline-flex rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-white/90 shadow">
            {asset.name}
          </span>
        </div>
        {preview.type === "naturalStack" && preview.total > 1 ? (
          <div className="pointer-events-none absolute top-1 right-1">
            <span className="inline-flex rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 shadow">
              ×{preview.total}
            </span>
          </div>
        ) : null}
        {isSelected && (
          <div className="absolute bottom-1 left-1 right-1 flex gap-1">
            <button
              type="button"
              className="flex-1 min-w-0 px-1.5 py-0.5 text-[10px] leading-tight rounded bg-red-700/90 hover:bg-red-600/90 truncate"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(asset);
              }}
              title="Delete asset"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(asset.id)}
      onKeyPress={handleKeyPress}
      className={`relative cursor-pointer ${nameBaseClasses} ${nameStateClasses}`}
      title={asset.name}
    >
      <div className="flex-1 min-w-0 py-1">
        <AssetPreview asset={asset} showPreview={showPreview} preview={preview} />
      </div>
      {isSelected && (
        <div className="mt-auto flex gap-1 overflow-hidden rounded-md">
          <button
            type="button"
            className="flex-1 px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(asset);
            }}
            title="Delete asset"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
