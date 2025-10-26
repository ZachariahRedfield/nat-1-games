import React from "react";
import NumericInput from "../common/NumericInput";

export default function SelectionMiniPanel({
  obj,
  tileSize,
  containerSize, // { w, h }
  onChangeSize, // (newW, newH) => void
  onRotate, // (deltaDeg) => void
  onFlipX, // () => void
  onFlipY, // () => void
  onDelete, // () => void
}) {
  if (!obj) return null;

  const panelW = 220;
  const panelH = 110;
  const left = obj.col * tileSize;
  const top = obj.row * tileSize;
  const w = obj.wTiles * tileSize;
  const h = obj.hTiles * tileSize;

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

  return (
    <div
      className="absolute bg-gray-900/95 text-white border border-gray-700 rounded shadow-lg p-2"
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
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={() => onRotate?.(-15)} title="Rotate -15">⟲</button>
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={() => onRotate?.(15)} title="Rotate +15">⟳</button>
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipX} title="Flip X">FX</button>
          <button className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" onClick={onFlipY} title="Flip Y">FY</button>
        </div>
        <button className="px-2 py-0.5 text-xs bg-red-700 hover:bg-red-600 rounded" onClick={onDelete} title="Delete">Del</button>
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
              onCommit={(v) => handleSizeCommit(v, obj.hTiles)}
              title="Cols (tiles)"
            />
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">X</span>
          </div>
        </div>
        <div className="inline-flex items-center">
          <div className="relative">
            <NumericInput
              value={Math.max(1, Math.round(obj.hTiles || 1))}
              min={1}
              max={100}
              step={1}
              className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
              onCommit={(v) => handleSizeCommit(obj.wTiles, v)}
              title="Rows (tiles)"
            />
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">Y</span>
          </div>
        </div>
      </div>
    </div>
  );
}
