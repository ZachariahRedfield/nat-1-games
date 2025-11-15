export function normalizeTileSize(value) {
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    return 32;
  }

  const clamped = Math.max(8, Math.min(128, parsedValue));
  return Math.round(clamped / 2) * 2;
}
