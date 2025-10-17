import React from "react";

export default function TokenLayer({
  tokens = [],
  assets = [],
  tileSize,
  cssWidth,
  cssHeight,
  visible = true,
  showHUD = true,
}) {
  const getAssetById = (id) => assets.find((a) => a.id === id);

  if (!visible) return null;
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: cssWidth, height: cssHeight, zIndex: 49, display: visible ? "block" : "none" }}
    >
      {tokens.map((t) => {
        const a = getAssetById(t.assetId);
        // Support both legacy image-kind tokens and new token-kind assets
        if (!a || (a.kind !== "image" && a.kind !== "token")) return null;
        const left = t.col * tileSize;
        const top = t.row * tileSize;
        const w = (t.wTiles || 1) * tileSize;
        const h = (t.hTiles || 1) * tileSize;
        const rot = t.rotation || 0;
        const sx = t.flipX ? -1 : 1;
        const sy = t.flipY ? -1 : 1;
        const opacity = t.opacity ?? 1;
        const glow = t.glowColor || "#7dd3fc"; // default sky-blue
        return (
          <div
            key={t.id}
            className="absolute"
            style={{
              left,
              top,
              width: w,
              height: h,
              transformOrigin: "center",
              transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
              opacity,
            }}
          >
            <img
              src={a.src}
              alt={a.name}
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                filter: `drop-shadow(0 0 3px ${glow}) drop-shadow(0 0 6px ${glow})`,
              }}
            />
            {/* Simple token HUD: name and HP at the bottom */}
            {showHUD && (t.meta?.name || typeof t.meta?.hp === 'number') && (
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/60 text-white text-[10px] leading-3 px-1 py-[2px] flex justify-between gap-2 pointer-events-none select-none"
                style={{ backdropFilter: 'blur(2px)' }}
              >
                <span className="truncate max-w-[70%]">{t.meta?.name || 'Token'}</span>
                {typeof t.meta?.hp === 'number' && (
                  <span className="opacity-90">HP {t.meta.hp}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
