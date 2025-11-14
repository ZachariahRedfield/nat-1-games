import { clamp } from "../utils.js";

const CORNER_SIGNS = {
  nw: { x: -1, y: -1 },
  ne: { x: 1, y: -1 },
  sw: { x: -1, y: 1 },
  se: { x: 1, y: 1 },
};

export function getCornerSign(corner) {
  return CORNER_SIGNS[corner] || CORNER_SIGNS.se;
}

export function oppositeCorner(corner) {
  switch (corner) {
    case "nw":
      return "se";
    case "ne":
      return "sw";
    case "sw":
      return "ne";
    default:
      return "nw";
  }
}

function normalizeSize(value, fallback = 1) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function getHalfExtents(entity) {
  const width = normalizeSize(entity?.wTiles, 1);
  const height = normalizeSize(entity?.hTiles, 1);
  return { halfW: width / 2, halfH: height / 2 };
}

function getCenter(entity) {
  const { halfW, halfH } = getHalfExtents(entity);
  return {
    col: (entity?.col ?? 0) + halfW,
    row: (entity?.row ?? 0) + halfH,
  };
}

function rotateVector({ x, y }, rotationDeg) {
  if (!rotationDeg) return { x, y };
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function rotateToLocal(vec, rotationDeg) {
  if (!rotationDeg) return { ...vec };
  const rad = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: vec.x * cos - vec.y * sin,
    y: vec.x * sin + vec.y * cos,
  };
}

export function getCornerWorldPosition(entity, corner) {
  const sign = getCornerSign(corner);
  const { halfW, halfH } = getHalfExtents(entity);
  const { col: centerCol, row: centerRow } = getCenter(entity);
  const offset = rotateVector({ x: sign.x * halfW, y: sign.y * halfH }, entity?.rotation || 0);
  return {
    col: centerCol + offset.x,
    row: centerRow + offset.y,
  };
}

export function computeResizeUpdate({
  pointerRow,
  pointerCol,
  anchorRow,
  anchorCol,
  rotation = 0,
  signX = 1,
  signY = 1,
  minWidthTiles = 1,
  minHeightTiles = 1,
  geometry,
}) {
  if (!geometry) return null;

  const totalRows = Number.isFinite(geometry?.rows) ? geometry.rows : Number.MAX_SAFE_INTEGER;
  const totalCols = Number.isFinite(geometry?.cols) ? geometry.cols : Number.MAX_SAFE_INTEGER;

  const safePointerRow = Number.isFinite(pointerRow) ? pointerRow : 0;
  const safePointerCol = Number.isFinite(pointerCol) ? pointerCol : 0;
  const safeAnchorRow = Number.isFinite(anchorRow) ? anchorRow : 0;
  const safeAnchorCol = Number.isFinite(anchorCol) ? anchorCol : 0;

  const pointerRowClamped = clamp(safePointerRow, 0, totalRows);
  const pointerColClamped = clamp(safePointerCol, 0, totalCols);

  let centerRow = (safeAnchorRow + pointerRowClamped) / 2;
  let centerCol = (safeAnchorCol + pointerColClamped) / 2;

  const worldVec = {
    x: pointerColClamped - centerCol,
    y: pointerRowClamped - centerRow,
  };

  let localVec = rotateToLocal(worldVec, rotation);

  const minHalfW = Math.max(0.5, minWidthTiles / 2);
  const minHalfH = Math.max(0.5, minHeightTiles / 2);

  const desiredSignX = signX >= 0 ? 1 : -1;
  const desiredSignY = signY >= 0 ? 1 : -1;

  if (desiredSignX >= 0) {
    localVec.x = Math.max(minHalfW, localVec.x);
  } else {
    localVec.x = Math.min(-minHalfW, localVec.x);
  }

  if (desiredSignY >= 0) {
    localVec.y = Math.max(minHalfH, localVec.y);
  } else {
    localVec.y = Math.min(-minHalfH, localVec.y);
  }

  const halfW = Math.max(minHalfW, Math.abs(localVec.x));
  const halfH = Math.max(minHalfH, Math.abs(localVec.y));

  let wTiles = Math.max(1, Math.round(halfW * 2));
  let hTiles = Math.max(1, Math.round(halfH * 2));

  const quantHalfW = wTiles / 2;
  const quantHalfH = hTiles / 2;

  const pointerLocal = { x: desiredSignX * quantHalfW, y: desiredSignY * quantHalfH };
  const anchorLocal = { x: -pointerLocal.x, y: -pointerLocal.y };

  const anchorWorldOffset = rotateVector(anchorLocal, rotation);

  centerCol = safeAnchorCol - anchorWorldOffset.x;
  centerRow = safeAnchorRow - anchorWorldOffset.y;

  let col = centerCol - quantHalfW;
  let row = centerRow - quantHalfH;

  const maxCol = Math.max(0, totalCols - wTiles);
  const maxRow = Math.max(0, totalRows - hTiles);

  col = clamp(col, 0, maxCol);
  row = clamp(row, 0, maxRow);

  return {
    row: Math.round(row),
    col: Math.round(col),
    wTiles,
    hTiles,
  };
}
