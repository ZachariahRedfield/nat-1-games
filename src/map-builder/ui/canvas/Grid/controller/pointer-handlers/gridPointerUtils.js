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

  const snapToGrid = !!gridSettings?.snapToGrid;
  const row = snapToGrid ? Math.floor(rowRaw) : rowRaw;
  const col = snapToGrid ? Math.floor(colRaw) : colRaw;

  return { row, col, rowRaw, colRaw };
}
