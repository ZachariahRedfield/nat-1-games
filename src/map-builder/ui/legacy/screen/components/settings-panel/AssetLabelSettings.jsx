import React, { useMemo } from "react";
import { NumericInput, TextCommitInput } from "../../../../../../shared/index.js";

export default function AssetLabelSettings({
  selectedObj,
  selectedObjsList,
  assets,
  snapshotSettings,
  regenerateLabelInstance,
}) {
  const assetWithLabel = useMemo(() => {
    if (!selectedObj || !Array.isArray(assets)) {
      return null;
    }

    const asset = assets.find((candidate) => candidate?.id === selectedObj.assetId);
    if (!asset || asset.kind !== "image" || !asset.labelMeta) {
      return null;
    }

    return asset;
  }, [assets, selectedObj]);

  if (!assetWithLabel) {
    return null;
  }

  const hasMultipleSelection = (selectedObjsList?.length || 0) > 1;
  if (hasMultipleSelection) {
    return null;
  }

  const { labelMeta } = assetWithLabel;

  const commitLabelChanges = (changes) => {
    if (!selectedObj?.assetId) {
      return;
    }

    snapshotSettings?.();
    regenerateLabelInstance?.(selectedObj.assetId, { ...labelMeta, ...changes });
  };

  return (
    <div className="mt-3">
      <h3 className="font-bold text-sm mb-2">Label Settings</h3>
      <div className="grid gap-2">
        <label className="text-xs">
          Text
          <TextCommitInput
            className="w-full p-1 text-black rounded"
            value={labelMeta.text || ""}
            onCommit={(value) => commitLabelChanges({ text: value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            Color
            <input
              type="color"
              className="w-full h-8 p-0 border border-gray-500 rounded"
              value={labelMeta.color || "#ffffff"}
              onChange={(event) =>
                commitLabelChanges({
                  color: event.target.value,
                })
              }
            />
          </label>
          <label className="text-xs">
            Font Size
            <NumericInput
              value={labelMeta.size || 28}
              min={8}
              max={128}
              step={1}
              onCommit={(value) =>
                commitLabelChanges({
                  size: value,
                })
              }
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
          <label className="text-xs col-span-2">
            Font Family
            <TextCommitInput
              className="w-full p-1 text-black rounded"
              value={labelMeta.font || "Arial"}
              onCommit={(value) => commitLabelChanges({ font: value })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
