import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetPanel from "../../asset-library/AssetPanel.jsx";
import AssetDrawerSettings from "../modules/assets/drawer/AssetDrawerSettings.jsx";
import AssetPreviewSection from "../modules/assets/drawer/AssetPreviewSection.jsx";
import SelectionSettingsPanel from "../screen/components/settings-panel/SelectionSettingsPanel.jsx";

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
  selectionPanelProps,
  selectedObj,
  handleSelectionChange,
  clearObjectSelection,
  clearTokenSelection,
  setCurrentLayer,
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
  const [activeTab, setActiveTab] = useState("assets");
  const [placedSearch, setPlacedSearch] = useState("");
  const previousTabRef = useRef(activeTab);

  useEffect(() => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (previousTabRef.current !== "assets" && activeTab === "assets") {
      clearObjectSelection?.();
      clearTokenSelection?.();
    }
    previousTabRef.current = activeTab;
  }, [activeTab, clearObjectSelection, clearTokenSelection]);

  const handleToggle = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const handleOpenTab = useCallback((tab) => {
    setActiveTab(tab);
    setCollapsed(false);
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
      right: 0,
      writingMode: "vertical-rl",
      textOrientation: "mixed",
    }),
    []
  );

  const tabWrapStyle = useMemo(
    () => ({
      top: Math.max(16, topOffset + 16),
      right: 0,
    }),
    [topOffset]
  );

  const { assets = [], objects = {} } = assetPanelProps ?? {};

  const placedAssets = useMemo(() => {
    const list = [];
    const byId = new Map((assets || []).map((asset) => [asset.id, asset]));
    const nameCounts = new Map();

    Object.entries(objects || {}).forEach(([layerId, layerObjects]) => {
      (layerObjects || []).forEach((obj) => {
        const asset = byId.get(obj.assetId);
        const customName = typeof obj?.name === "string" ? obj.name.trim() : "";
        const baseName = customName || asset?.name || asset?.kind || "Asset";
        const count = (nameCounts.get(baseName) ?? 0) + 1;
        nameCounts.set(baseName, count);
        list.push({
          id: obj.id,
          obj,
          layerId,
          baseName,
          label: customName || `${baseName}${count}`,
        });
      });
    });

    return list;
  }, [assets, objects]);

  const handleSelectPlacedAsset = useCallback(
    (entry) => {
      if (!entry) return;
      if (setCurrentLayer) {
        setCurrentLayer(entry.layerId);
      }
      handleSelectionChange?.(entry.obj);
    },
    [handleSelectionChange, setCurrentLayer]
  );

  const hasSelection =
    selectionPanelProps?.selectedObj ||
    selectionPanelProps?.selectedToken ||
    (selectionPanelProps?.selectedObjsList?.length || 0) > 0 ||
    (selectionPanelProps?.selectedTokensList?.length || 0) > 0;

  const filteredPlacedAssets = useMemo(() => {
    const query = placedSearch.trim().toLowerCase();
    if (!query) return placedAssets;
    return placedAssets.filter((entry) => {
      const label = entry.label?.toLowerCase() ?? "";
      const base = entry.baseName?.toLowerCase() ?? "";
      const layer = entry.layerId?.toLowerCase?.() ?? "";
      return label.includes(query) || base.includes(query) || layer.includes(query);
    });
  }, [placedAssets, placedSearch]);

  return (
    <>
      <div className="fixed z-[10018] pointer-events-none" style={panelStyle}>
        {!collapsed && (
          <div className="relative h-full bg-gray-900/95 border-l border-gray-700 shadow-2xl flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 text-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("assets")}
                  className={`text-xs uppercase tracking-wide px-2 py-1 rounded border border-gray-600 ${
                    activeTab === "assets" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Assets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("placed")}
                  className={`text-xs uppercase tracking-wide px-2 py-1 rounded border border-gray-600 ${
                    activeTab === "placed" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Placed
                </button>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="text-xs uppercase tracking-wide bg-gray-800 border border-gray-600 px-2 py-1 rounded"
              >
                Minimize
              </button>
            </div>
            <div
              className={`flex-1 p-3 text-gray-100 ${
                activeTab === "assets" ? "overflow-y-auto" : "overflow-hidden"
              }`}
            >
              {activeTab === "assets" ? (
                <>
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
                </>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-0 border-b border-gray-700 pb-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                      <span>Placed Assets</span>
                      <span>{filteredPlacedAssets.length}</span>
                    </div>
                    <div className="mt-3">
                      <input
                        type="search"
                        value={placedSearch}
                        onChange={(event) => setPlacedSearch(event.target.value)}
                        placeholder="Search placed assets..."
                        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                        aria-label="Search placed assets"
                      />
                    </div>
                    <div className="mt-3 h-full overflow-y-auto space-y-1 pr-1">
                      {placedAssets.length === 0 ? (
                        <div className="text-sm text-gray-400">No placed assets yet.</div>
                      ) : filteredPlacedAssets.length === 0 ? (
                        <div className="text-sm text-gray-400">No placed assets match that search.</div>
                      ) : (
                        filteredPlacedAssets.map((entry) => {
                          const isSelected = selectedObj?.id === entry.id;
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => handleSelectPlacedAsset(entry)}
                              className={`w-full text-left px-2 py-1.5 rounded border ${
                                isSelected
                                  ? "border-blue-400 bg-blue-500/10 text-blue-100"
                                  : "border-gray-700 bg-gray-800/70 text-gray-100 hover:border-gray-500"
                              }`}
                            >
                              <div className="text-sm font-medium">{entry.label}</div>
                              <div className="text-xs text-gray-400">Layer: {entry.layerId}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 pt-6 overflow-y-auto">
                    {hasSelection ? (
                      <SelectionSettingsPanel {...selectionPanelProps} allowInactiveSelection />
                    ) : (
                      <div className="text-sm text-gray-400">
                        Select a placed asset from the list or the map to edit its settings.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div
              role="presentation"
              onMouseDown={handleDragStart}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-gray-700/40 hover:bg-gray-500/70"
            />
          </div>
        )}
      </div>
      {collapsed && (
        <div className="fixed z-[10019] flex flex-col gap-2" style={tabWrapStyle}>
          <button
            type="button"
            onClick={() => handleOpenTab("assets")}
            style={tabStyle}
            title="Open assets panel"
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-l-lg bg-gray-800 border border-gray-600 text-gray-100 shadow-sm"
          >
            Assets
          </button>
          <button
            type="button"
            onClick={() => handleOpenTab("placed")}
            style={tabStyle}
            title="Open placed assets panel"
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-l-lg bg-gray-800 border border-gray-600 text-gray-100 shadow-sm"
          >
            Placed
          </button>
        </div>
      )}
    </>
  );
}
