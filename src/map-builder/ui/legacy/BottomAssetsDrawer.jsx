import React, { useEffect, useRef, useState } from 'react';
import AssetPanel from './AssetPanel';
import BrushSettings from "./BrushSettings";

function AssetPreview({ selectedAsset, gridSettings }) {
  const containerRef = React.useRef(null);
  const [tilePx, setTilePx] = React.useState(32);
  const wTiles = Math.max(1, Math.round(gridSettings?.sizeCols || gridSettings?.sizeTiles || 1));
  let aspect = 1;
  let src = null;
  let label = '';
  if (selectedAsset) {
    label = selectedAsset.name || selectedAsset.kind;
    if (selectedAsset.kind === 'natural') {
      src = selectedAsset.variants?.[0]?.src || null;
      aspect = selectedAsset.variants?.[0]?.aspectRatio || 1;
    } else if (selectedAsset.kind === 'image' || selectedAsset.kind === 'token') {
      src = selectedAsset.src || null;
      aspect = selectedAsset.aspectRatio || 1;
    } else if (selectedAsset.kind === 'color') {
      aspect = 1;
    }
  }
  const hTiles = Math.max(1, Math.round(gridSettings?.sizeRows || (wTiles / (aspect || 1)) || wTiles));

  // Recompute tile size to ensure exactly 1 empty tile around the asset
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const totalCols = Math.max(1, wTiles + 2);
      const totalRows = Math.max(1, hTiles + 2);
      const t = Math.max(8, Math.min(96, Math.floor(Math.min(rect.width / totalCols, rect.height / totalRows))));
      setTilePx(t);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wTiles, hTiles]);

  const widthPx = wTiles * tilePx;
  const heightPx = hTiles * tilePx;
  const rot = (gridSettings?.rotation || 0);
  const flipX = gridSettings?.flipX ? -1 : 1;
  const flipY = gridSettings?.flipY ? -1 : 1;
  const opacity = Math.max(0.05, Math.min(1, gridSettings?.opacity ?? 1));
  const gridBg = {
    backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
    backgroundSize: `${tilePx}px ${tilePx}px, ${tilePx}px ${tilePx}px`,
    backgroundColor: '#111827',
  };
  const gridWidth = (wTiles + 2) * tilePx;
  const gridHeight = (hTiles + 2) * tilePx;
  const offset = tilePx; // one tile margin on each side
  return (
    <div className="w-full" aria-label="Asset Preview">
      <div className="text-xs opacity-80 mb-1">Preview</div>
      <div ref={containerRef} className="relative w-full h-72 md:h-80 border border-gray-700 rounded overflow-hidden" style={{ backgroundColor: '#111827' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative overflow-hidden" style={{ ...gridBg, width: gridWidth, height: gridHeight }}>
            <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: 'absolute', left: offset, top: offset, width: widthPx, height: heightPx }}>
              {selectedAsset ? (
                selectedAsset.kind === 'color' ? (
                  <div
                    className="rounded shadow"
                    style={{ width: '100%', height: '100%', backgroundColor: selectedAsset.color || '#cccccc', opacity, transform: `rotate(${rot}deg) scale(${flipX}, ${flipY})`, transformOrigin: 'center' }}
                  />
                ) : src ? (
                  <img
                    src={src}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'fill', opacity, transform: `rotate(${rot}deg) scale(${flipX}, ${flipY})`, transformOrigin: 'center' }}
                  />
                ) : (
                  <div className="text-xs text-gray-400">No preview</div>
                )
              ) : (
                <div className="text-xs text-gray-400">Select an asset</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

const STORAGE_KEY = 'assetsDrawer.height.v2';

function BottomAssetsDrawer(props) {
  const {
    assetPanelProps,
    initialHeight = 0,
    minHeight = 0,
    maxHeightPct = 0.7,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
  } = props || {};
  const [height, setHeight] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : initialHeight;
  });
  const draggingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(height));
  }, [height]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const viewH = window.innerHeight || document.documentElement.clientHeight || 800;
      const maxHeight = Math.round(viewH * maxHeightPct);
      const newH = Math.min(maxHeight, Math.max(minHeight, Math.round(viewH - e.clientY)));
      setHeight(newH);
    };
    const onUp = () => { draggingRef.current = false; document.body.style.userSelect = ''; document.body.style.cursor=''; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [maxHeightPct, minHeight]);

  const startDrag = (e) => {
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const collapsed = height <= Math.max(0, minHeight);

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[10020] pointer-events-none">
      {/* Drag handle row (no wide hit area; use the tab) */}
      <div className="relative h-0 select-none pointer-events-none">
        {/* Folder-style tab aligned left and connected to drawer */}
        <div
          className="absolute left-3 bottom-[-1px] px-2 py-0.5 text-xs rounded-t-md bg-gray-800 border border-gray-600 border-b-0 text-gray-100 pointer-events-auto shadow-sm"
          style={{ cursor: 'ns-resize' }}
          onPointerDown={startDrag}
          title="Drag to resize"
        >
          Assets
        </div>
      </div>

      {/* Drawer content */}
      <div
        className={`pointer-events-auto bg-gray-900/95 ${collapsed ? 'border-t-0' : 'border-t border-gray-700 shadow-2xl'} backdrop-blur-[1px]`}
        style={{ height }}
      >
        <div className="h-full overflow-y-auto p-3 text-gray-100">
          <AssetPanel {...assetPanelProps} />

          {/* Settings section at the bottom of the Assets drawer */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const persistAssetStamp = (updater) => {
                  setAssetStamp((prev) => {
                    const next = typeof updater === 'function' ? updater(prev) : updater;
                    try {
                      const sid = assetPanelProps?.selectedAssetId;
                      if (sid && next) assetPanelProps?.updateAssetById?.(sid, { stampDefaults: next });
                    } catch {}
                    return next;
                  });
                };
                const a = assetPanelProps?.selectedAsset;
                if (a?.kind === 'natural') {
                  const persistNatural = (updater) => {
                    setNaturalSettings((prev) => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      try {
                        const sid = assetPanelProps?.selectedAssetId;
                        if (sid && next) assetPanelProps?.updateAssetById?.(sid, { naturalDefaults: next });
                      } catch {}
                      return next;
                    });
                  };
                  return (
                    <BrushSettings
                      kind="natural"
                      gridSettings={assetStamp}
                      setGridSettings={persistAssetStamp}
                      naturalSettings={naturalSettings}
                      setNaturalSettings={persistNatural}
                      titleOverride="Settings"
                      showSnapControls={false}
                      showStep={false}
                      hideNaturalSize={true}
                    />
                  );
                }
                return (
                  <BrushSettings
                    kind="grid"
                    gridSettings={assetStamp}
                    setGridSettings={persistAssetStamp}
                    titleOverride="Settings"
                    showSnapControls={false}
                    showStep={assetPanelProps?.selectedAsset?.kind !== 'token' && assetPanelProps?.selectedAsset?.kind !== 'tokenGroup'}
                    tokenHighlightColor={assetPanelProps?.selectedAsset?.kind === 'token' ? (assetPanelProps?.selectedAsset?.glowDefault || '#7dd3fc') : undefined}
                    onChangeTokenHighlight={assetPanelProps?.selectedAsset?.kind === 'token' ? ((hex)=> assetPanelProps?.updateAssetById?.(assetPanelProps?.selectedAsset?.id, { glowDefault: hex })) : undefined}
                  />
                );
              })()}
              {/* Preview with vertical Flip controls on the left */}
              <div className="w-full flex md:flex-row flex-col gap-2">
                <div className="flex flex-col gap-2 items-start justify-start md:mr-2 mt-2 md:mt-8">
                  <label className="text-xs inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!assetStamp?.flipY}
                      onChange={(e) => setAssetStamp((s)=> ({ ...s, flipY: e.target.checked }))}
                    />
                    Flip Y
                  </label>
                  <label className="text-xs inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!assetStamp?.flipX}
                      onChange={(e) => setAssetStamp((s)=> ({ ...s, flipX: e.target.checked }))}
                    />
                    Flip X
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <AssetPreview selectedAsset={assetPanelProps?.selectedAsset} gridSettings={assetStamp} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BottomAssetsDrawer;
