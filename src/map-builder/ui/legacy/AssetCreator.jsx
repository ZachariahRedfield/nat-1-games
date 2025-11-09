import React from "react";
import AssetCreatorForm from "./modules/assets/creation/components/AssetCreatorForm.jsx";
import { createAssetPayload, updateAssetPayload } from "./modules/assets/creation/assetPayloadBuilders.js";
import { useAssetCreatorState } from "./modules/assets/creation/useAssetCreatorState.js";

export default function AssetCreator({
  kind = "image",
  onClose,
  onCreate,
  onUpdate,
  initialAsset = null,
  selectedImageSrc,
  mode = "create",
}) {
  const state = useAssetCreatorState({ kind, initialAsset });

  const performCreate = async () => {
    const payload = await createAssetPayload({
      tab: state.tab,
      state,
      selectedImageSrc,
    });

    if (!payload) return false;
    onCreate?.(payload.asset, payload.assetType);
    return true;
  };

  const performUpdate = async () => {
    const payload = await updateAssetPayload({
      tab: state.tab,
      state,
      initialAsset,
      selectedImageSrc,
    });

    if (!payload) return false;
    onUpdate?.(payload);
    return true;
  };

  const handleSave = async () => {
    if (mode === "edit") {
      await performUpdate();
    } else {
      await performCreate();
    }
    onClose?.();
  };

  const handleSaveCopy = async () => {
    await performCreate();
    onClose?.();
  };

  return (
    <div className="mb-3 p-2 border border-gray-600 rounded space-y-3">
      <AssetCreatorForm state={state} />
      <div className="flex gap-2">
        {mode === "edit" ? (
          <>
            <button
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              onClick={handleSave}
              type="button"
            >
              Save
            </button>
            <button
              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-sm"
              title="Save as a new asset"
              onClick={handleSaveCopy}
              type="button"
            >
              Save Copy
            </button>
          </>
        ) : (
          <button
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            onClick={handleSave}
            type="button"
          >
            Save Asset
          </button>
        )}
        <button className="px-2 py-1 bg-gray-700 rounded text-sm" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}
