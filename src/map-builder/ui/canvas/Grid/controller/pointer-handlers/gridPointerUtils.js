export function getPointerCssPosition(event) {
  const target = event.currentTarget || event.target;
  const rect = target?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
  const offsetX = parseFloat(target?.dataset?.offsetX || 0);
  const offsetY = parseFloat(target?.dataset?.offsetY || 0);
  return {
    rect,
    xCss: event.clientX - rect.left - offsetX,
    yCss: event.clientY - rect.top - offsetY,
    offsetX,
    offsetY,
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
