import React from "react";
import NumericInput from "../common/NumericInput";
import RotationWheel from "../common/RotationWheel";
import AlphaSlider from "../common/AlphaSlider";

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
}) {
  if (!obj) return null;

  const panelW = 280;
  const panelH = 120;
  const left = obj.col * tileSize;
  const top = obj.row * tileSize;
  const w = (obj.wTiles || 1) * tileSize;
  const h = (obj.hTiles || 1) * tileSize;

  // Try to place panel left of the object; fallback to right; clamp vertically
  let defX = left - panelW - 8;
  if (defX < 0) defX = left + w + 8;
  let defY = top + h / 2 - panelH / 2;
  const minY = 4;
  const maxY = Math.max(minY, containerSize.h - panelH - 4);
  defY = Math.max(minY, Math.min(maxY, defY));

  const [pos, setPos] = React.useState({ x: defX, y: defY });
  const movedRef = React.useRef(false);
  React.useEffect(() => {
    if (movedRef.current) return; // preserve manual position
    setPos({ x: defX, y: defY });
  }, [obj?.id, tileSize, containerSize.w, containerSize.h]);

  // Dragging
  const dragStartRef = React.useRef(null); // {x,y,px,py}
  const onDragStart = (e) => {
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY, px: pos.x, py: pos.y };
    movedRef.current = true;
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  };
  const onDragMove = (e) => {
    const st = dragStartRef.current; if (!st) return;
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
    const dx = clientX - st.x;
    const dy = clientY - st.y;
    const nx = Math.max(4, Math.min(containerSize.w - panelW - 4, st.px + dx));
    const ny = Math.max(4, Math.min(containerSize.h - panelH - 4, st.py + dy));
    setPos({ x: nx, y: ny });
  };
  const onDragEnd = () => {
    dragStartRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  };

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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipX} title="Flip X">FX</button>
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipY} title="Flip Y">FY</button>
          <label className="text-[11px] inline-flex items-center gap-1 ml-1" title="Grid Snap">
            <input type="checkbox" checked={!!snapToGrid} onChange={onToggleSnap} />
            <span>Snap</span>
          </label>
        </div>
        {/* Delete button removed per request */}
      </div>
      <div className="flex items-end gap-3">
        <div className="inline-flex items-center">
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
        </div>

        {/* Link/Unlink toggle between X and Y */}
        <button
          type="button"
          onClick={onToggleLink}
          title={linkXY ? 'Linked: change one to set both' : 'Unlinked: set X and Y independently'}
          className={`mx-1 p-1 rounded border ${linkXY ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
          aria-pressed={linkXY}
        >
          {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
        </button>

        <div className="inline-flex items-center">
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
      </div>

      {/* Rotation wheel bottom-right */}
      <div className="absolute" style={{ right: 6, bottom: 28 }}>
        <div className="relative">
          <RotationWheel
            value={Math.round(obj.rotation || 0)}
            size={64}
            onChange={(ang) => {
              const r0 = Math.round(obj.rotation || 0);
              let delta = Math.round(ang) - r0;
              if (delta > 180) delta -= 360;
              if (delta < -180) delta += 360;
              onRotate?.(delta);
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] text-gray-300">
            Rotation
          </div>
        </div>
      </div>

      {/* Opacity slider bottom-left, tucked in with label */}
      <div className="absolute" style={{ left: 6, bottom: 2, width: 160 }}>
        <div className="relative">
          <AlphaSlider
            value={Math.max(0.05, Math.min(1, opacity))}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(e) => onChangeOpacity?.(parseFloat(e.target.value))}
            ariaLabel="Opacity"
          />
          <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/60">
            Opacity
          </div>
        </div>
      </div>
    </div>
  );
}
