import React, { useMemo } from "react";
import { resolvePrimaryPreview } from "../assetGrouping.js";

function getAssetTypeTag(asset) {
  if (!asset) return null;
  if (asset.kind === "color") return "Material";
  if (asset.kind === "image" && asset.labelMeta) return "Label";
  if (asset.kind === "image") return "Image";
  if (asset.kind === "natural") return "Natural";
  if (asset.kind === "token" || asset.kind === "tokenGroup") return "Token";
  return null;
}

function getAssetTagClasses(tag) {
  if (tag === "Material") {
    return "bg-emerald-900/80 text-emerald-100";
  }
  if (tag === "Natural") {
    return "bg-amber-900/80 text-amber-100";
  }
  if (tag === "Token") {
    return "bg-fuchsia-900/80 text-fuchsia-100";
  }
  if (tag === "Label") {
    return "bg-cyan-900/80 text-cyan-100";
  }
  return "bg-blue-900/80 text-blue-100";
}

function getAssetSizeLabel(asset) {
  if (!asset) return "—";
  const defaults = asset.defaults || {};
  const sizePx = Number.isFinite(defaults.sizePx) ? Math.round(defaults.sizePx) : null;
  const sizeCols = Number.isFinite(defaults.sizeCols) ? defaults.sizeCols : null;
  const sizeRows = Number.isFinite(defaults.sizeRows) ? defaults.sizeRows : null;
  const sizeTiles = Number.isFinite(defaults.sizeTiles) ? defaults.sizeTiles : null;

  if (sizePx !== null) {
    return `${sizePx}px`;
  }

  if (sizeCols !== null && sizeRows !== null) {
    return `${sizeCols}x${sizeRows} tiles`;
  }

  if (sizeTiles !== null) {
    return `${sizeTiles} tile${sizeTiles === 1 ? "" : "s"}`;
  }

  return "—";
}

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
                className="absolute inset-0 w-full h-full object-cover rounded-none shadow-md"
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
  const typeTag = getAssetTypeTag(asset);
  const tagClasses = typeTag ? getAssetTagClasses(typeTag) : "";
  const sizeLabel = useMemo(() => getAssetSizeLabel(asset), [asset]);

  const previewBaseClasses =
    "group relative w-2/3 mx-auto aspect-square overflow-hidden rounded-none border-2 shadow-sm transition";
  const previewStateClasses = isSelected
    ? "border-white/70 ring-1 ring-white/40"
    : "border-slate-200/30 hover:border-slate-100/50";
  const detailsWrapperClasses = "relative w-full";
  const detailsRowClasses = `grid grid-cols-[minmax(0,1fr)_minmax(0,100px)_minmax(0,80px)] items-center gap-2 px-2 py-1 text-xs ${
    isSelected ? "bg-gray-700/70 text-gray-100" : "bg-gray-900/40 text-gray-200 hover:bg-gray-800/70"
  }`;

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
        {typeTag ? (
          <div className="pointer-events-none absolute bottom-1 right-1">
            <span
              className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide shadow ${tagClasses}`}
            >
              {typeTag}
            </span>
          </div>
        ) : null}
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
      className={`relative cursor-pointer ${detailsWrapperClasses}`}
      title={asset.name}
    >
      <div className={detailsRowClasses}>
        <div className="min-w-0 font-medium truncate" title={asset.name}>
          {asset.name}
        </div>
        <div className="min-w-0">
          {typeTag ? (
            <span
              className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide shadow ${tagClasses}`}
            >
              {typeTag}
            </span>
          ) : (
            <span className="text-[10px] uppercase text-gray-400">—</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-300">
          <span>{sizeLabel}</span>
          {isSelected && (
            <button
              type="button"
              className="rounded-sm bg-red-700/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white hover:bg-red-600/90"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(asset);
              }}
              title="Delete asset"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
