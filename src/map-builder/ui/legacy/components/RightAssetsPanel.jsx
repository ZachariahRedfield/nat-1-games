import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetPanel from "../../asset-library/AssetPanel.jsx";
import AssetDrawerSettings from "../modules/assets/drawer/AssetDrawerSettings.jsx";
import AssetPreviewSection from "../modules/assets/drawer/AssetPreviewSection.jsx";
import SelectionSettingsPanel from "../screen/components/settings-panel/SelectionSettingsPanel.jsx";
import { useResponsiveMode } from "../../../../shared/index.js";
import { getRightAssetsPanelPointerEventClasses } from "./rightAssetsPanelPointerEvents.js";

const WIDTH_STORAGE_KEY = "mapBuilder.rightAssetsPanel.width.v1";
const COLLAPSED_STORAGE_KEY = "mapBuilder.rightAssetsPanel.collapsed.v1";
const ASSET_LIST_HEIGHT_STORAGE_KEY = "mapBuilder.rightAssetsPanel.assetListHeight.v1";

const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 260;
const MAX_WIDTH_FALLBACK = 520;
const MAX_WIDTH_PCT = 0.75;

function getMaxWidth() {
  if (typeof window === "undefined") return MAX_WIDTH_FALLBACK;
  return Math.max(MIN_WIDTH, Math.round(window.innerWidth * MAX_WIDTH_PCT));
}

function getViewport() {
  if (typeof window === "undefined") {
    return { width: MAX_WIDTH_FALLBACK, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function clampWidth(value, maxWidth) {
  if (Number.isNaN(value)) return DEFAULT_WIDTH;
  return Math.min(maxWidth, Math.max(MIN_WIDTH, value));
}

function getAssetTypeTag(asset, fallbackKind) {
  const kind = asset?.kind ?? fallbackKind;
  if (kind === "color") return "Material";
  if (kind === "image" && asset?.labelMeta) return "Label";
  if (kind === "image") return "Image";
  if (kind === "natural") return "Natural";
  if (kind === "token" || kind === "tokenGroup" || fallbackKind === "token") return "Token";
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

export default function RightAssetsPanel({
  assetPanelProps,
  assetStamp,
  setAssetStamp,
  naturalSettings,
  setNaturalSettings,
  engine,
  interactionMode,
  brushSize,
  setBrushSize,
  tileSize,
  snapshotSettings,
  selectionPanelProps,
  selectedObj,
  selectedToken,
  handleSelectionChange,
  handleTokenSelectionChange,
  clearObjectSelection,
  clearTokenSelection,
  setCurrentLayer,
  canActOnSelection,
  onSaveSelection,
  onDeleteSelection,
  topOffset = 0,
}) {
  const dragState = useRef(null);
  const [maxWidth, setMaxWidth] = useState(() => getMaxWidth());
  const [viewport, setViewport] = useState(() => getViewport());
  const { isMobile } = useResponsiveMode();
  const [width, setWidth] = useState(() => {
    const stored = Number.parseInt(localStorage.getItem(WIDTH_STORAGE_KEY), 10);
    return clampWidth(Number.isFinite(stored) ? stored : DEFAULT_WIDTH, getMaxWidth());
  });
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored === "true";
  });
  const [activeTab, setActiveTab] = useState("assets");
  const [placedSearch, setPlacedSearch] = useState("");
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [sheetMode, setSheetMode] = useState("peek");
  const previousTabRef = useRef(activeTab);

  useEffect(() => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewport();
      setMaxWidth(getMaxWidth());
      setViewport(nextViewport);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setWidth((prev) => clampWidth(prev, maxWidth));
  }, [maxWidth]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!isMobile) {
      setSheetMode("peek");
    }
  }, [isMobile]);

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

  const handleSheetModeToggle = useCallback(() => {
    setSheetMode((value) => (value === "peek" ? "full" : "peek"));
  }, []);

  const selectedObjsList = selectionPanelProps?.selectedObjsList ?? [];
  const selectedTokensList = selectionPanelProps?.selectedTokensList ?? [];
  const selectionCount = selectedObjsList.length + selectedTokensList.length;

  const handleToggleMultiSelect = useCallback(() => {
    setMultiSelectEnabled((value) => {
      const next = !value;
      if (!next && selectionCount > 1) {
        if (selectedToken) {
          handleTokenSelectionChange?.(selectedToken);
          handleSelectionChange?.([]);
        } else if (selectedObj) {
          handleSelectionChange?.(selectedObj);
          handleTokenSelectionChange?.([]);
        } else {
          handleSelectionChange?.([]);
          handleTokenSelectionChange?.([]);
        }
      }
      return next;
    });
  }, [
    handleSelectionChange,
    handleTokenSelectionChange,
    selectedObj,
    selectedToken,
    selectionCount,
  ]);

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
    if (isMobile) return undefined;
    const handleDragMove = (event) => {
      if (!dragState.current) return;
      const delta = dragState.current.startX - event.clientX;
      setWidth(clampWidth(dragState.current.startWidth + delta, maxWidth));
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
  }, [isMobile, maxWidth]);

  const panelStyle = useMemo(() => {
    if (isMobile) {
      const usableHeight = viewport.height - Math.max(0, topOffset) - 24;
      const targetHeight = sheetMode === "full" ? Math.round(viewport.height * 0.85) : Math.round(viewport.height * 0.45);
      const panelHeight = Math.max(220, Math.min(targetHeight, usableHeight));
      return {
        left: 0,
        right: 0,
        bottom: 0,
        top: "auto",
        width: "100%",
        height: collapsed ? 0 : panelHeight,
      };
    }
    return {
      top: Math.max(0, topOffset),
      right: 0,
      bottom: 0,
      width: collapsed ? 0 : width,
    };
  }, [collapsed, isMobile, sheetMode, topOffset, viewport.height, width]);

  const tabStyle = useMemo(() => {
    if (isMobile) {
      return {};
    }
    return {
      right: 0,
      writingMode: "vertical-rl",
      textOrientation: "mixed",
    };
  }, [isMobile]);

  const tabWrapStyle = useMemo(() => {
    if (isMobile) {
      return {
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        left: 16,
        right: 16,
        top: "auto",
      };
    }
    return {
      top: Math.max(16, topOffset + 16),
      right: 0,
    };
  }, [isMobile, topOffset]);

  const pointerEventClasses = getRightAssetsPanelPointerEventClasses({ collapsed });

  const { assets = [], objects = {}, tokens = [] } = assetPanelProps ?? {};

  const placedAssets = useMemo(() => {
    const list = [];
    const byId = new Map((assets || []).map((asset) => [asset.id, asset]));
    const nameCounts = new Map();

    const incrementCount = (baseName, kind) => {
      const key = `${kind || "asset"}:${baseName}`;
      const count = (nameCounts.get(key) ?? 0) + 1;
      nameCounts.set(key, count);
      return count;
    };

    Object.entries(objects || {}).forEach(([layerId, layerObjects]) => {
      (layerObjects || []).forEach((obj) => {
        const asset = byId.get(obj.assetId);
        const customName = typeof obj?.name === "string" ? obj.name.trim() : "";
        const baseName = customName || asset?.name || asset?.kind || "Asset";
        const count = incrementCount(baseName, asset?.kind || "image");
        list.push({
          id: obj.id,
          kind: "object",
          obj,
          layerId,
          baseName,
          label: customName || `${baseName}${count}`,
          key: `object-${obj.id}`,
          asset,
          assetTag: getAssetTypeTag(asset, asset?.kind),
        });
      });
    });

    (tokens || []).forEach((token) => {
      const asset = byId.get(token.assetId);
      const customName = typeof token?.meta?.name === "string" ? token.meta.name.trim() : "";
      const baseName = customName || asset?.name || "Token";
      const count = incrementCount(baseName, "token");
      list.push({
        id: token.id,
        kind: "token",
        token,
        layerId: "tokens",
        baseName,
        label: customName || `${baseName}${count}`,
        key: `token-${token.id}`,
        asset,
        assetTag: getAssetTypeTag(asset, "token"),
      });
    });

    return list;
  }, [assets, objects, tokens]);

  const placedAssetsByKey = useMemo(
    () => new Map(placedAssets.map((entry) => [entry.key, entry])),
    [placedAssets],
  );

  useEffect(() => {
    if (selectionCount > 1) {
      setMultiSelectEnabled(true);
    }
  }, [selectionCount]);

  const selectedEntryKeys = useMemo(() => {
    const next = new Set();
    selectedObjsList.forEach((obj) => {
      if (obj?.id) {
        next.add(`object-${obj.id}`);
      }
    });
    selectedTokensList.forEach((token) => {
      if (token?.id) {
        next.add(`token-${token.id}`);
      }
    });
    return next;
  }, [selectedObjsList, selectedTokensList]);

  const handleToggleMultiSelectEntry = useCallback(
    (key) => {
      const nextKeys = new Set(selectedEntryKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }

      const selectedEntries = Array.from(nextKeys)
        .map((entryKey) => placedAssetsByKey.get(entryKey))
        .filter(Boolean);
      const selectedObjects = selectedEntries
        .filter((entry) => entry.kind === "object")
        .map((entry) => entry.obj);
      const selectedTokens = selectedEntries
        .filter((entry) => entry.kind === "token")
        .map((entry) => entry.token);

      handleSelectionChange?.(selectedObjects);
      handleTokenSelectionChange?.(selectedTokens);
    },
    [
      handleSelectionChange,
      handleTokenSelectionChange,
      placedAssetsByKey,
      selectedEntryKeys,
    ],
  );

  const effectiveMultiSelect = multiSelectEnabled || selectionCount > 1;

  const handleSelectPlacedAsset = useCallback(
    (entry) => {
      if (!entry) return;
      if (effectiveMultiSelect) {
        handleToggleMultiSelectEntry(entry.key);
        return;
      }
      if (entry.kind === "token") {
        if (selectedObjsList.length) {
          clearObjectSelection?.();
        }
        if (selectedToken?.id === entry.id) {
          clearTokenSelection?.();
          return;
        }
        handleTokenSelectionChange?.(entry.token);
        return;
      }
      if (selectedObj?.id === entry.id) {
        clearObjectSelection?.();
        return;
      }
      if (selectedTokensList.length) {
        clearTokenSelection?.();
      }
      if (setCurrentLayer) {
        setCurrentLayer(entry.layerId);
      }
      handleSelectionChange?.(entry.obj);
    },
    [
      clearObjectSelection,
      clearTokenSelection,
      effectiveMultiSelect,
      handleSelectionChange,
      handleTokenSelectionChange,
      handleToggleMultiSelectEntry,
      selectedObjsList.length,
      selectedObj?.id,
      selectedTokensList.length,
      selectedToken?.id,
      setCurrentLayer,
    ]
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
      <div className={pointerEventClasses.overlayClassName}>
        {!collapsed && (
          <div
            className={`${pointerEventClasses.panelClassName} absolute bg-gray-900/95 shadow-2xl flex flex-col ${
              isMobile ? "border-t border-gray-700 rounded-t-2xl" : "border-l border-gray-700"
            }`}
            style={{ ...panelStyle, ...(isMobile ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" } : {}) }}
          >
            {isMobile ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSheetModeToggle}
                  className="h-2 w-14 rounded-full bg-gray-600/80"
                  aria-label={sheetMode === "full" ? "Collapse assets panel" : "Expand assets panel"}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 text-gray-100 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("assets")}
                  className={`flex-1 text-[11px] sm:text-xs uppercase tracking-wide px-3 py-1.5 sm:px-2 sm:py-1 rounded border border-gray-600 ${
                    activeTab === "assets" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Assets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("placed")}
                  className={`flex-1 text-[11px] sm:text-xs uppercase tracking-wide px-3 py-1.5 sm:px-2 sm:py-1 rounded border border-gray-600 ${
                    activeTab === "placed" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Placed
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <button
                    type="button"
                    onClick={handleSheetModeToggle}
                    className="text-[11px] uppercase tracking-wide bg-gray-800 border border-gray-600 px-3 py-1.5 rounded"
                  >
                    {sheetMode === "full" ? "Peek" : "Expand"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleToggle}
                  className="text-[11px] sm:text-xs uppercase tracking-wide bg-gray-800 border border-gray-600 px-3 py-1.5 sm:px-2 sm:py-1 rounded"
                >
                  Minimize
                </button>
              </div>
            </div>
            <div
              className={`flex-1 text-gray-100 ${
                activeTab === "assets" ? "overflow-y-auto p-0" : "overflow-hidden p-2 sm:p-3"
              }`}
            >
              {activeTab === "assets" ? (
                <div className="flex flex-col h-full">
                  <AssetPanel
                    {...assetPanelProps}
                    assetListHeightStorageKey={ASSET_LIST_HEIGHT_STORAGE_KEY}
                    disableReorder={isMobile}
                    disableResize={isMobile}
                  />

                  {assetPanelProps?.selectedAssetId ? (
                    <div className="mt-4 border-t border-gray-700 px-3 pb-3 pt-3">
                      <div className="grid gap-4">
                        <AssetDrawerSettings
                          assetPanelProps={assetPanelProps}
                          assetStamp={assetStamp}
                          setAssetStamp={setAssetStamp}
                          naturalSettings={naturalSettings}
                          setNaturalSettings={setNaturalSettings}
                          engine={engine}
                          interactionMode={interactionMode}
                          brushSize={brushSize}
                          setBrushSize={setBrushSize}
                          tileSize={tileSize}
                          snapshotSettings={snapshotSettings}
                        />
                        <AssetPreviewSection
                          assetPanelProps={assetPanelProps}
                          assetStamp={assetStamp}
                          setAssetStamp={setAssetStamp}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div
                    className={`flex-[1.4] min-h-[5vh] max-h-[95vh] border-b border-gray-700 pb-6 flex flex-col overflow-hidden ${
                      isMobile ? "" : "resize-y"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                      <span>Placed Assets</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400">
                          <input
                            type="checkbox"
                            checked={effectiveMultiSelect}
                            onChange={handleToggleMultiSelect}
                            className="h-3 w-3 rounded border-gray-600 bg-gray-900 text-blue-500"
                          />
                          Multi-select
                        </label>
                        <span>{filteredPlacedAssets.length}</span>
                      </div>
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
                    <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 overscroll-contain touch-pan-y">
                      {placedAssets.length === 0 ? (
                        <div className="text-sm text-gray-400">No placed assets yet.</div>
                      ) : filteredPlacedAssets.length === 0 ? (
                        <div className="text-sm text-gray-400">No placed assets match that search.</div>
                      ) : (
                        filteredPlacedAssets.map((entry) => {
                          const isSelected = effectiveMultiSelect
                            ? selectedEntryKeys.has(entry.key)
                            : entry.kind === "token"
                              ? selectedToken?.id === entry.id
                              : selectedObj?.id === entry.id;
                          const tagClasses = entry.assetTag ? getAssetTagClasses(entry.assetTag) : "";
                          const subtitle =
                            entry.kind === "token" ? "Token" : `Layer: ${entry.layerId}`;
                          return (
                            <div
                              key={entry.key}
                              className={`w-full flex items-start gap-2 px-2 py-1.5 rounded border ${
                                isSelected
                                  ? "border-blue-400 bg-blue-500/10 text-blue-100"
                                  : "border-gray-700 bg-gray-800/70 text-gray-100 hover:border-gray-500"
                              }`}
                            >
                              {effectiveMultiSelect && (
                                <input
                                  type="checkbox"
                                  checked={selectedEntryKeys.has(entry.key)}
                                  onChange={() => handleToggleMultiSelectEntry(entry.key)}
                                  className="mt-1 h-3.5 w-3.5 rounded border-gray-600 bg-gray-900 text-blue-500"
                                  aria-label={`Select ${entry.label}`}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => handleSelectPlacedAsset(entry)}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm font-medium">{entry.label}</div>
                                  {entry.assetTag ? (
                                    <span
                                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide shadow ${tagClasses}`}
                                    >
                                      {entry.assetTag}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-gray-400">{subtitle}</div>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 pt-6 overflow-y-auto overscroll-contain touch-pan-y">
                    {hasSelection ? (
                      <>
                        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                          <span>Selected Asset</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!canActOnSelection) return;
                              onSaveSelection?.();
                            }}
                            disabled={!canActOnSelection}
                            className={`flex-1 rounded border px-2 py-1 text-xs uppercase tracking-wide ${
                              canActOnSelection
                                ? "border-blue-400 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30"
                                : "border-gray-700 bg-gray-800 text-gray-500"
                            }`}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canActOnSelection) return;
                              onDeleteSelection?.();
                            }}
                            disabled={!canActOnSelection}
                            className={`flex-1 rounded border px-2 py-1 text-xs uppercase tracking-wide ${
                              canActOnSelection
                                ? "border-red-500 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                                : "border-gray-700 bg-gray-800 text-gray-500"
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="mt-4">
                          <SelectionSettingsPanel {...selectionPanelProps} allowInactiveSelection />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">
                        Select a placed asset from the list or the map to edit its settings.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!isMobile ? (
              <div
                role="presentation"
                onMouseDown={handleDragStart}
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-gray-700/40 hover:bg-gray-500/70"
              />
            ) : null}
          </div>
        )}
      </div>
      {collapsed && (
        <div
          className={`fixed z-[10019] pointer-events-auto flex gap-2 ${
            isMobile ? "flex-row justify-center" : "flex-col"
          }`}
          style={tabWrapStyle}
        >
          <button
            type="button"
            onClick={() => handleOpenTab("assets")}
            style={tabStyle}
            title="Open assets panel"
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-gray-800 border border-gray-600 text-gray-100 shadow-sm ${
              isMobile ? "rounded-full" : "rounded-l-lg"
            }`}
          >
            Assets
          </button>
          <button
            type="button"
            onClick={() => handleOpenTab("placed")}
            style={tabStyle}
            title="Open placed assets panel"
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-gray-800 border border-gray-600 text-gray-100 shadow-sm ${
              isMobile ? "rounded-full" : "rounded-l-lg"
            }`}
          >
            Placed
          </button>
        </div>
      )}
    </>
  );
}
