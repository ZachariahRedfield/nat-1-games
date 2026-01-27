// Shared constants and small helpers for the Grid module

export const BASE_TILE = 32; // canvas buffer px per tile (zoom-safe)

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const hexToRgba = (hex, a) => {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${a ?? 1})`;
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a ?? 1})`;
};

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

