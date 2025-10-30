import React, { useEffect, useRef, useState } from 'react';
import AssetPanel from './AssetPanel';

const STORAGE_KEY = 'assetsDrawer.height.v2';

export default function BottomAssetsDrawer({
  // Props forwarded to AssetPanel
  assetPanelProps,
  // Optional: initial height in px (0 = collapsed)
  initialHeight = 0,
  minHeight = 0,
  maxHeightPct = 0.7,
}) {
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
        </div>
      </div>
    </div>
  );
}
