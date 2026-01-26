export function getPointerCssPosition(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const offsetX = parseFloat(event.currentTarget?.dataset?.offsetX || 0);
  const offsetY = parseFloat(event.currentTarget?.dataset?.offsetY || 0);
  return {
    rect,
    xCss: event.clientX - rect.left - offsetX,
    yCss: event.clientY - rect.top - offsetY,
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
