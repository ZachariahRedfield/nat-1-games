import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetPanel from "../../asset-library/AssetPanel.jsx";
import AssetDrawerSettings from "../modules/assets/drawer/AssetDrawerSettings.jsx";
import AssetPreviewSection from "../modules/assets/drawer/AssetPreviewSection.jsx";

const WIDTH_STORAGE_KEY = "mapBuilder.rightAssetsPanel.width.v1";
const COLLAPSED_STORAGE_KEY = "mapBuilder.rightAssetsPanel.collapsed.v1";

const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 260;
const MAX_WIDTH = 520;

function clampWidth(value) {
  if (Number.isNaN(value)) return DEFAULT_WIDTH;
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export default function RightAssetsPanel({
  assetPanelProps,
  assetStamp,
  setAssetStamp,
  naturalSettings,
  setNaturalSettings,
  topOffset = 0,
}) {
  const dragState = useRef(null);
  const [width, setWidth] = useState(() => {
    const stored = Number.parseInt(localStorage.getItem(WIDTH_STORAGE_KEY), 10);
    return clampWidth(Number.isFinite(stored) ? stored : DEFAULT_WIDTH);
  });
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const handleToggle = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const handleDragStart = useCallback((event) => {
    event.preventDefault();
    dragState.current = {
      startX: event.clientX,
      startWidth: width,
    };
  }, [width]);

  useEffect(() => {
    const handleDragMove = (event) => {
      if (!dragState.current) return;
      const delta = dragState.current.startX - event.clientX;
      setWidth(clampWidth(dragState.current.startWidth + delta));
    };

    const handleDragEnd = () => {
      dragState.current = null;
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  const panelStyle = useMemo(
    () => ({
      top: Math.max(0, topOffset),
      right: 0,
      bottom: 0,
      width: collapsed ? 0 : width,
    }),
    [collapsed, topOffset, width]
  );

  const tabStyle = useMemo(
    () => ({
      top: Math.max(16, topOffset + 16),
      right: 0,
      writingMode: "vertical-rl",
      textOrientation: "mixed",
    }),
    [topOffset]
  );

  return (
    <>
      <div className="fixed z-[10018] pointer-events-none" style={panelStyle}>
        {!collapsed && (
          <div className="relative h-full bg-gray-900/95 border-l border-gray-700 shadow-2xl flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 text-gray-100">
              <span className="text-sm font-semibold">Assets & Settings</span>
              <button
                type="button"
                onClick={handleToggle}
                className="text-xs uppercase tracking-wide bg-gray-800 border border-gray-600 px-2 py-1 rounded"
              >
                Minimize
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-gray-100">
              <AssetPanel {...assetPanelProps} />

              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="grid gap-4">
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
            <div
              role="presentation"
              onMouseDown={handleDragStart}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-gray-700/40 hover:bg-gray-500/70"
            />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        style={tabStyle}
        title={collapsed ? "Open assets panel" : "Minimize assets panel"}
        className="fixed z-[10019] px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-l-lg bg-gray-800 border border-gray-600 text-gray-100 shadow-sm"
      >
        Assets
      </button>
    </>
  );
}
