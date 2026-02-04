import React, { useEffect, useMemo, useState } from "react";
import AssetListSection from "./components/AssetListSection.jsx";
import { assetMatchesGroup } from "./assetGrouping.js";
import { getAssetTypeTag } from "./assetTags.js";
import useAssetPanelHandlers from "./hooks/useAssetPanelHandlers.js";

export default function AssetPanel(props) {
  const {
    showAssetPreviews,
    setShowAssetPreviews,
    assets,
    selectedAssetId,
    selectAsset,
    openCreator,
    setAssets,
    setSelectedAssetId,
    confirmFn,
    reorderAssets,
    openEditAsset,
    assetListHeightStorageKey,
    disableReorder = false,
    disableResize = false,
  } = props;

  const [assetSearch, setAssetSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  const visibleAssets = useMemo(() => {
    const list = Array.isArray(assets) ? assets : [];
    return list.filter((asset) => assetMatchesGroup(asset));
  }, [assets]);

  const tagOptions = useMemo(() => {
    const tags = new Set();
    visibleAssets.forEach((asset) => {
      const tag = getAssetTypeTag(asset);
      if (tag) tags.add(tag);
    });
    const order = ["Image", "Label", "Material", "Natural", "Token"];
    return order.filter((tag) => tags.has(tag));
  }, [visibleAssets]);

  useEffect(() => {
    if (tagFilter === "all") return;
    if (!tagOptions.includes(tagFilter)) {
      setTagFilter("all");
    }
  }, [tagFilter, tagOptions]);

  const tagFilteredAssets = useMemo(() => {
    if (!tagFilter || tagFilter === "all") return visibleAssets;
    return visibleAssets.filter((asset) => getAssetTypeTag(asset) === tagFilter);
  }, [tagFilter, visibleAssets]);

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return tagFilteredAssets;
    return tagFilteredAssets.filter((asset) => {
      const name = asset?.name || "";
      return name.toLowerCase().includes(query);
    });
  }, [assetSearch, tagFilteredAssets]);

  const {
    handleOpenCreator,
    handleSelectAsset,
    handleEditAsset,
    handleDeleteAsset,
    handleToggleView,
  } = useAssetPanelHandlers({
    openCreator,
    selectAsset,
    openEditAsset,
    confirmFn,
    visibleAssets,
    setAssets,
    setSelectedAssetId,
    setShowAssetPreviews,
  });

  const [assetKind, setAssetKind] = useState("image");
  const [isCreatorPromptOpen, setIsCreatorPromptOpen] = useState(false);
  const assetOptions = [
    { value: "image", label: "Image" },
    { value: "text", label: "Text/Label" },
    { value: "material", label: "Color" },
    { value: "natural", label: "Natural" },
    { value: "token", label: "Token" },
  ];

  const openCreatorPrompt = () => setIsCreatorPromptOpen(true);
  const closeCreatorPrompt = () => setIsCreatorPromptOpen(false);
  const confirmCreatorPrompt = () => {
    handleOpenCreator?.(assetKind);
    setIsCreatorPromptOpen(false);
  };

  return (
    <div className="relative">
      <AssetListSection
        assets={filteredAssets}
        totalAssets={visibleAssets.length}
        showAssetPreviews={showAssetPreviews}
        onToggleView={handleToggleView}
        selectedAssetId={selectedAssetId}
        onSelect={handleSelectAsset}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        onCreateAsset={openCreatorPrompt}
        searchQuery={assetSearch}
        onSearchChange={setAssetSearch}
        onClearSearch={() => setAssetSearch("")}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        tagOptions={tagOptions}
        onReorder={reorderAssets}
        persistedHeightKey={assetListHeightStorageKey}
        disableReorder={disableReorder}
        disableResize={disableResize}
      />

      {isCreatorPromptOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeCreatorPrompt}
        >
          <div
            className="w-full max-w-xs rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-sm font-semibold text-gray-100">Create Asset</div>
            <p className="mt-1 text-xs text-gray-400">Select the type of asset you want to create.</p>
            <label className="mt-3 flex flex-col gap-1 text-[11px] uppercase tracking-wide text-gray-400">
              Type
              <select
                value={assetKind}
                onChange={(event) => setAssetKind(event.target.value)}
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                {assetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-600 px-2.5 py-1 text-xs text-gray-200 hover:bg-gray-800"
                onClick={closeCreatorPrompt}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                onClick={confirmCreatorPrompt}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
