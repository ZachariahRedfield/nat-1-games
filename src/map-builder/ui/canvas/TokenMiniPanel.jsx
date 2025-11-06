import React from "react";

export default function TokenMiniPanel({
  token,
  tileSize,
  containerSize, // { w, h }
  onChangeGlow, // (hex) => void
}) {
  if (!token) return null;

  const panelW = 220;
  const panelH = 86;
  const left = token.col * tileSize;
  const top = token.row * tileSize;
  const w = (token.wTiles || 1) * tileSize;
  const h = (token.hTiles || 1) * tileSize;

  // Prefer placing to the left; fallback to right; clamp vertically
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
  }, [token?.id, tileSize, containerSize.w, containerSize.h]);

  // drag
  const dragRef = React.useRef(null);
  const onDragStart = (e) => {
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
    dragRef.current = { x: clientX, y: clientY, px: pos.x, py: pos.y };
    movedRef.current = true;
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
  };
  const onDragMove = (e) => {
    const st = dragRef.current; if (!st) return;
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
    const dx = clientX - st.x;
    const dy = clientY - st.y;
    const nx = Math.max(4, Math.min(containerSize.w - panelW - 4, st.px + dx));
    const ny = Math.max(4, Math.min(containerSize.h - panelH - 4, st.py + dy));
    setPos({ x: nx, y: ny });
  };
  const onDragEnd = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
  };

  const glow = token.glowColor || '#7dd3fc';

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
        Token
      </div>

      {/* Highlight color group */}
      <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-full">
        <span>Highlight</span>
        <input
          type="color"
          value={glow}
          onChange={(e) => onChangeGlow?.(e.target.value)}
          className="w-8 h-5 p-0 border border-gray-500 rounded"
          title="Highlight color"
        />
        <input
          type="text"
          className="flex-1 p-1 text-black rounded"
          value={glow}
          onChange={(e) => onChangeGlow?.(e.target.value)}
          placeholder="#7dd3fc"
        />
      </div>
    </div>
  );
}

