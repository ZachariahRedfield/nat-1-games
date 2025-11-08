import React from "react";
import { NumericInput, RotationWheel, AlphaSlider } from "../../../shared/index.js";

export default function SelectionMiniPanel({
  obj,
  tileSize,
  containerSize, // { w, h }
  onChangeSize, // (newW, newH) => void
  onRotate, // (deltaDeg) => void
  onFlipX, // () => void
  onFlipY, // () => void
  // onDelete removed from UI by request
  opacity = 1,
  onChangeOpacity, // (value 0..1)
  snapToGrid = true,
  onToggleSnap, // () => void
  linkXY = false,
  onToggleLink, // () => void
  // optional: token highlight color
  highlightColor,
  onChangeHighlightColor,
}) {
  const panelW = 280;
  const showHighlight = typeof highlightColor === "string" && typeof onChangeHighlightColor === "function";
  const safeTileSize = Number.isFinite(tileSize) ? tileSize : 0;
  const containerW = containerSize?.w ?? 0;
  const containerH = containerSize?.h ?? 0;
  const panelH = showHighlight ? 196 : 156; // extra space to avoid overlap with opacity group
  const left = (obj?.col ?? 0) * safeTileSize;
  const top = (obj?.row ?? 0) * safeTileSize;
  const w = (obj?.wTiles ?? 1) * safeTileSize;
  const h = (obj?.hTiles ?? 1) * safeTileSize;

  // Try to place panel left of the object; fallback to right; clamp vertically
  let defX = left - panelW - 8;
  if (defX < 0) defX = left + w + 8;
  let defY = top + h / 2 - panelH / 2;
  const minY = 4;
  const maxY = Math.max(minY, containerH - panelH - 4);
  defY = Math.max(minY, Math.min(maxY, defY));
  const defaultPos = { x: defX, y: defY };

  const [pos, setPos] = React.useState(() => defaultPos);
  const movedRef = React.useRef(false);
  const prevObjIdRef = React.useRef(obj?.id ?? null);
  const dragStartRef = React.useRef(null); // {x,y,px,py}

  React.useEffect(() => {
    const currentId = obj?.id ?? null;
    if (prevObjIdRef.current !== currentId) {
      prevObjIdRef.current = currentId;
      movedRef.current = false;
    }
    if (!obj) {
      setPos({ x: defaultPos.x, y: defaultPos.y });
      return;
    }
    if (movedRef.current) return; // preserve manual position for same selection
    setPos({ x: defaultPos.x, y: defaultPos.y });
  }, [obj?.id, defaultPos.x, defaultPos.y, containerW, containerH, panelH]);

  const onDragMove = React.useCallback(
    (e) => {
      const st = dragStartRef.current;
      if (!st) return;
      const point = e.touches ? e.touches[0] : e;
      if (!point) return;
      const dx = point.clientX - st.x;
      const dy = point.clientY - st.y;
      const nx = Math.max(4, Math.min(containerW - panelW - 4, st.px + dx));
      const ny = Math.max(4, Math.min(containerH - panelH - 4, st.py + dy));
      setPos({ x: nx, y: ny });
    },
    [containerW, containerH, panelH]
  );

  const onDragEnd = React.useCallback(() => {
    dragStartRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  }, [onDragMove]);

  const onDragStart = React.useCallback(
    (e) => {
      const point = e.touches ? e.touches[0] : e;
      if (!point) return;
      dragStartRef.current = { x: point.clientX, y: point.clientY, px: pos.x, py: pos.y };
      movedRef.current = true;
      window.addEventListener("pointermove", onDragMove);
      window.addEventListener("pointerup", onDragEnd);
    },
    [onDragEnd, onDragMove, pos.x, pos.y]
  );

  React.useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  if (!obj) return null;

  const handleSizeCommit = (newW, newH) => {
    const W = Math.max(1, Math.round(newW));
    const H = Math.max(1, Math.round(newH));
    onChangeSize?.(W, H);
  };

  const LinkIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9.5 11.5h-3a3 3 0 0 1 0-6h3" strokeLinecap="round" />
    </svg>
  );
  const LinkBrokenIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9 6L10.5 4.5M7 6L5.5 4.5M9 10l1.5 1.5M7 10L5.5 11.5" strokeLinecap="round" />
    </svg>
  );

  const wheelSize = 64;
  return (
    <div
      className="absolute bg-gray-900/95 text-white border border-gray-700 rounded shadow-lg p-2 relative"
      style={{ left: pos.x, top: pos.y, width: panelW, height: panelH, zIndex: 10060 }}
    >
      <div
        className="text-[11px] font-semibold mb-2 cursor-move select-none"
        onPointerDown={onDragStart}
        title="Drag to move"
      >
        Object
      </div>
      {/* Top controls grouped with crisp white outline */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit">
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipX} title="Flip X">FX</button>
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipY} title="Flip Y">FY</button>
          <label className="inline-flex items-center gap-1" title="Grid Snap">
            <input type="checkbox" checked={!!snapToGrid} onChange={onToggleSnap} />
            <span>Snap</span>
          </label>
        </div>
      </div>

      {/* Size group with crisp white outline */}
      <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit mb-2">
        <div className="relative">
          <NumericInput
            value={Math.max(1, Math.round(obj.wTiles || 1))}
            min={1}
            max={100}
            step={1}
            className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v) => {
              const n = Math.max(1, Math.round(v));
              if (linkXY) handleSizeCommit(n, n);
              else handleSizeCommit(n, obj.hTiles);
            }}
            title="Cols (tiles)"
          />
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
        </div>
        <button
          type="button"
          onClick={onToggleLink}
          title={linkXY ? 'Linked: change one to set both' : 'Unlinked: set X and Y independently'}
          className={`p-1 rounded border ${linkXY ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
          aria-pressed={linkXY}
        >
          {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
        </button>
        <div className="relative">
          <NumericInput
            value={Math.max(1, Math.round(obj.hTiles || 1))}
            min={1}
            max={100}
            step={1}
            className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
            onCommit={(v) => {
              const n = Math.max(1, Math.round(v));
              if (linkXY) handleSizeCommit(n, n);
              else handleSizeCommit(obj.wTiles, n);
            }}
            title="Rows (tiles)"
          />
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
        </div>
      </div>

      {/* Highlight color (for tokens). Render only if provided via props */}
      {typeof highlightColor === 'string' && onChangeHighlightColor && (
        <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit mb-3">
          <span>Highlight</span>
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => onChangeHighlightColor(e.target.value)}
            className="w-8 h-5 p-0 border border-gray-500 rounded"
            title="Highlight color"
          />
          <input
            type="text"
            className="w-24 p-1 text-black rounded"
            value={highlightColor}
            onChange={(e) => onChangeHighlightColor(e.target.value)}
            placeholder="#7dd3fc"
          />
        </div>
      )}

      {/* Rotation area anchored at top-right: numeric above, wheel below */}
      <div className="absolute" style={{ right: 6, top: 10, width: wheelSize }}>
        <div className="w-full flex justify-center mb-1">
          <div className="text-xs inline-flex items-center px-1 py-0.5 border border-white rounded-none w-fit">
            <NumericInput
              value={Math.round(obj.rotation || 0)}
              min={0}
              max={359}
              step={1}
              className="w-10 px-1 py-0.5 text-[11px] text-black rounded"
              onCommit={(v) => {
                const cur = Math.round(obj.rotation || 0);
                let next = Math.max(0, Math.min(359, Math.round(v)));
                const delta = ((next - cur + 540) % 360) - 180; // shortest delta
                onRotate?.(delta);
              }}
              title="Rotation (degrees)"
            />
          </div>
        </div>
        <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
          <RotationWheel
            value={Math.round(obj.rotation || 0)}
            size={wheelSize}
            onChange={(ang) => {
              const r0 = Math.round(obj.rotation || 0);
              let delta = Math.round(ang) - r0;
              if (delta > 180) delta -= 360;
              if (delta < -180) delta += 360;
              onRotate?.(delta);
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] text-gray-300">Rotation</div>
        </div>
      </div>

      {/* Opacity area at bottom-left: numeric + slider inside one white outline */}
      <div className="absolute" style={{ left: 6, bottom: 2, width: 240 }}>
        <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-full">
          <div className="inline-flex items-center">
            <NumericInput
              value={Math.max(0.05, Math.min(1, opacity))}
              min={0.05}
              max={1}
              step={0.05}
              className="w-10 px-1 py-0.5 text-[11px] text-black rounded"
              onCommit={(v) => {
                const n = Math.max(0.05, Math.min(1, parseFloat(v)));
                onChangeOpacity?.(n);
              }}
              title="Opacity"
            />
          </div>
          <div className="flex-1" style={{ minWidth: 140 }}>
            <AlphaSlider
              value={Math.max(0.05, Math.min(1, opacity))}
              min={0.05}
              max={1}
              step={0.05}
              onChange={(e) => onChangeOpacity?.(parseFloat(e.target.value))}
              ariaLabel="Opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
