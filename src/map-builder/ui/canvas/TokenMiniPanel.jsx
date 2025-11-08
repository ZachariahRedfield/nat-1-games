import React from "react";

export default function TokenMiniPanel({
  token,
  tileSize,
  containerSize, // { w, h }
  onChangeGlow, // (hex) => void
}) {
  const safeTileSize = Number.isFinite(tileSize) ? tileSize : 0;
  const containerW = containerSize?.w ?? 0;
  const containerH = containerSize?.h ?? 0;

  const panelW = 220;
  const panelH = 86;
  const left = (token?.col ?? 0) * safeTileSize;
  const top = (token?.row ?? 0) * safeTileSize;
  const w = (token?.wTiles ?? 1) * safeTileSize;
  const h = (token?.hTiles ?? 1) * safeTileSize;

  // Prefer placing to the left; fallback to right; clamp vertically
  let defX = left - panelW - 8;
  if (defX < 0) defX = left + w + 8;
  const minY = 4;
  const maxY = Math.max(minY, containerH - panelH - 4);
  let defY = top + h / 2 - panelH / 2;
  defY = Math.max(minY, Math.min(maxY, defY));
  const defaultPos = { x: defX, y: defY };

  const [pos, setPos] = React.useState(() => defaultPos);
  const movedRef = React.useRef(false);
  const prevTokenIdRef = React.useRef(token?.id ?? null);
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    const currentId = token?.id ?? null;
    if (prevTokenIdRef.current !== currentId) {
      prevTokenIdRef.current = currentId;
      movedRef.current = false;
    }
    if (!token) {
      setPos({ x: defaultPos.x, y: defaultPos.y });
      return;
    }
    if (movedRef.current) return; // preserve manual position for same token
    setPos({ x: defaultPos.x, y: defaultPos.y });
  }, [token?.id, defaultPos.x, defaultPos.y, containerW, containerH]);

  const onDragMove = React.useCallback(
    (e) => {
      const st = dragRef.current;
      if (!st) return;
      const point = e.touches ? e.touches[0] : e;
      if (!point) return;
      const dx = point.clientX - st.x;
      const dy = point.clientY - st.y;
      const nx = Math.max(4, Math.min(containerW - panelW - 4, st.px + dx));
      const ny = Math.max(4, Math.min(containerH - panelH - 4, st.py + dy));
      setPos({ x: nx, y: ny });
    },
    [containerW, containerH]
  );

  const onDragEnd = React.useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
  }, [onDragMove]);

  const onDragStart = React.useCallback(
    (e) => {
      const point = e.touches ? e.touches[0] : e;
      if (!point) return;
      dragRef.current = { x: point.clientX, y: point.clientY, px: pos.x, py: pos.y };
      movedRef.current = true;
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragEnd);
    },
    [onDragEnd, onDragMove, pos.x, pos.y]
  );

  React.useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  if (!token) return null;

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

