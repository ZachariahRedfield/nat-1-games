export function clampDimension(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.max(1, Math.min(200, base));
}

export default clampDimension;
