import React, { useMemo, useState } from "react";
import AssetCard from "./AssetCard.jsx";
import AssetViewToggle from "./AssetViewToggle.jsx";

export default function AssetListSection({
  assets,
  totalAssets,
  showAssetPreviews,
  onToggleView,
  selectedAssetId,
  onSelect,
  onEdit,
  onDelete,
  onCreateAsset,
  searchQuery,
  onSearchChange,
  onClearSearch,
  tagFilter,
  onTagFilterChange,
  tagOptions = [],
  onReorder,
}) {
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const hasSearch = useMemo(() => Boolean(searchQuery?.trim()), [searchQuery]);

  const handleDragStart = (assetId) => (event) => {
    setDraggedId(assetId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", assetId);
  };

  const handleDragOver = (assetId) => (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (assetId !== dropTargetId) {
      setDropTargetId(assetId);
    }
  };

  const handleDrop = (assetId) => (event) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggedId;
    if (sourceId && assetId && sourceId !== assetId) {
      onReorder?.(sourceId, assetId);
    }
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const emptyMessage = useMemo(() => {
    if (totalAssets === 0) return "No assets available.";
    if (hasSearch && assets.length === 0) return "No assets match that search.";
    return null;
  }, [assets.length, hasSearch, totalAssets]);

  return (
    <div className="mb-2 border border-gray-600 rounded overflow-hidden resize-y min-h-[5vh] max-h-[95vh] flex flex-col">
      <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide">Assets</span>
          <span className="rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] font-semibold text-gray-200">
            {totalAssets ?? assets.length}
          </span>
        </div>
        <AssetViewToggle showPreview={!!showAssetPreviews} onChange={onToggleView} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-gray-700 bg-gray-900/60 px-2 py-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search saved assets..."
            className="w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            aria-label="Search saved assets"
          />
          {hasSearch ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 hover:text-gray-200"
              onClick={onClearSearch}
            >
              Clear
            </button>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-400">
          Filter
          <select
            value={tagFilter}
            onChange={(event) => onTagFilterChange?.(event.target.value)}
            className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-blue-500"
          onClick={onCreateAsset}
        >
          Create Asset
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {showAssetPreviews ? (
          <div className="text-xs">
            <div className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,100px)_minmax(0,80px)] gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-700">
              <span>Preview</span>
              <span>Name</span>
              <span>Tag</span>
              <span>Size</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-800">
              {assets.map((asset) => {
                const isDropTarget = dropTargetId === asset.id && draggedId !== asset.id;
                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={handleDragStart(asset.id)}
                    onDragOver={handleDragOver(asset.id)}
                    onDrop={handleDrop(asset.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition ${isDropTarget ? "ring-2 ring-blue-400" : ""}`}
                    title="Drag to reorder"
                  >
                    <AssetCard
                      asset={asset}
                      isSelected={selectedAssetId === asset.id}
                      showPreview={!!showAssetPreviews}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
              {emptyMessage ? <div className="px-2 py-3 text-xs text-gray-400">{emptyMessage}</div> : null}
            </div>
          </div>
        ) : (
          <div className="text-xs">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,100px)_minmax(0,80px)] gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-700">
              <span>Name</span>
              <span>Tag</span>
              <span>Size</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-800">
              {assets.map((asset) => {
                const isDropTarget = dropTargetId === asset.id && draggedId !== asset.id;
                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={handleDragStart(asset.id)}
                    onDragOver={handleDragOver(asset.id)}
                    onDrop={handleDrop(asset.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition ${isDropTarget ? "ring-2 ring-blue-400" : ""}`}
                    title="Drag to reorder"
                  >
                    <AssetCard
                      asset={asset}
                      isSelected={selectedAssetId === asset.id}
                      showPreview={!!showAssetPreviews}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
              {emptyMessage ? <div className="px-2 py-3 text-xs text-gray-400">{emptyMessage}</div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
