import React from "react";
import AssetPanel from "../asset-library/AssetPanel.jsx";
import AssetDrawerSettings from "./modules/assets/drawer/AssetDrawerSettings.jsx";
import AssetPreviewSection from "./modules/assets/drawer/AssetPreviewSection.jsx";
import { useAssetsDrawerHeight } from "./modules/assets/drawer/useAssetsDrawerHeight.js";

const STORAGE_KEY = "assetsDrawer.height.v2";

export default function BottomAssetsDrawer(props = {}) {
  const {
    assetPanelProps,
    initialHeight = 0,
    minHeight = 0,
    maxHeightPct = 0.7,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
  } = props;

  const { height, collapsed, handleResizeStart } = useAssetsDrawerHeight({
    storageKey: STORAGE_KEY,
    initialHeight,
    minHeight,
    maxHeightPct,
  });

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[10020] pointer-events-none">
      <div className="relative h-0 select-none pointer-events-none">
        <div
          className="absolute left-3 bottom-[-1px] min-w-[120px] px-4 py-2 text-sm font-medium rounded-t-lg bg-gray-800 border border-gray-600 border-b-0 text-gray-100 pointer-events-auto shadow-sm flex items-center justify-center"
          style={{ cursor: "ns-resize" }}
          onPointerDown={handleResizeStart}
          title="Drag to resize"
        >
          <span className="pointer-events-none">Assets</span>
        </div>
      </div>

      <div
        className={`pointer-events-auto bg-gray-900/95 ${
          collapsed ? "border-t-0" : "border-t border-gray-700 shadow-2xl"
        } backdrop-blur-[1px]`}
        style={{ height }}
      >
        <div className="h-full overflow-y-auto p-3 text-gray-100">
          <AssetPanel {...assetPanelProps} />

          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AssetDrawerSettings
                assetPanelProps={assetPanelProps}
                assetStamp={assetStamp}
                setAssetStamp={setAssetStamp}
                naturalSettings={naturalSettings}
                setNaturalSettings={setNaturalSettings}
              />
              <AssetPreviewSection
                assetPanelProps={assetPanelProps}
                assetStamp={assetStamp}
                setAssetStamp={setAssetStamp}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
