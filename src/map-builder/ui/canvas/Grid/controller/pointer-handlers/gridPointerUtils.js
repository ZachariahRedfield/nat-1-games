export function quantize(value, step) {
  if (!step || step <= 0) return value;
  if (step === 1) return Math.floor(value);
  return Math.round(value / step) * step;
}

export function getPointerCssPosition(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    rect,
    xCss: event.clientX - rect.left,
    yCss: event.clientY - rect.top,
  };
}

export function computeGridPosition({ xCss, yCss, geometry, gridSettings }) {
  const { rows, cols, cssWidth, cssHeight } = geometry;

  let rowRaw = (yCss / cssHeight) * rows;
  let colRaw = (xCss / cssWidth) * cols;

  if (!gridSettings?.snapToGrid && gridSettings?.snapStep) {
    rowRaw = quantize(rowRaw, gridSettings.snapStep);
    colRaw = quantize(colRaw, gridSettings.snapStep);
  }

  const row = gridSettings?.snapToGrid ? Math.floor(rowRaw) : rowRaw;
  const col = gridSettings?.snapToGrid ? Math.floor(colRaw) : colRaw;

  return { row, col, rowRaw, colRaw };
}
