import { BASE_TILE, clamp, hexToRgba, dist, lerp } from "../utils.js";

const snapPointToTileCenter = (point) => {
  const offset = BASE_TILE / 2;
  const snap = (value) => Math.round((value - offset) / BASE_TILE) * BASE_TILE + offset;
  return { x: snap(point.x), y: snap(point.y) };
};

const getBrushCellBounds = (point, radius, bufferWidth, bufferHeight) => {
  const cols = bufferWidth > 0 ? Math.floor(bufferWidth / BASE_TILE) : 0;
  const rows = bufferHeight > 0 ? Math.floor(bufferHeight / BASE_TILE) : 0;
  if (!cols || !rows) return null;

  return {
    cols,
    rows,
    minCol: Math.max(0, Math.floor((point.x - radius) / BASE_TILE)),
    maxCol: Math.min(cols - 1, Math.floor((point.x + radius) / BASE_TILE)),
    minRow: Math.max(0, Math.floor((point.y - radius) / BASE_TILE)),
    maxRow: Math.min(rows - 1, Math.floor((point.y + radius) / BASE_TILE)),
  };
};

const clipToGridCells = (ctx, point, radius, bounds) => {
  if (!bounds) return;
  const { minRow, maxRow, minCol, maxCol } = bounds;
  ctx.beginPath();
  for (let row = minRow; row <= maxRow; row += 1) {
    const top = row * BASE_TILE;
    for (let col = minCol; col <= maxCol; col += 1) {
      const left = col * BASE_TILE;
      const right = left + BASE_TILE;
      const bottom = top + BASE_TILE;
      const closestX = clamp(point.x, left, right);
      const closestY = clamp(point.y, top, bottom);
      const dx = point.x - closestX;
      const dy = point.y - closestY;
      if (dx * dx + dy * dy <= radius * radius) {
        ctx.rect(left, top, BASE_TILE, BASE_TILE);
      }
    }
  }
  ctx.clip();
};

const resolveStampTiles = (stamp, gridSettings, selectedAsset) => {
  const sizeCols = stamp?.sizeCols ?? stamp?.sizeTiles ?? gridSettings?.sizeCols ?? gridSettings?.sizeTiles ?? 1;
  const sizeRows = stamp?.sizeRows ?? stamp?.sizeTiles ?? gridSettings?.sizeRows ?? gridSettings?.sizeTiles;
  const wTiles = Math.max(1, Math.round(sizeCols));
  if (typeof sizeRows === "number") {
    return { wTiles, hTiles: Math.max(1, Math.round(sizeRows)) };
  }
  const aspect = selectedAsset?.aspectRatio || 1;
  return { wTiles, hTiles: Math.max(1, Math.round(wTiles / aspect)) };
};

export const paintBrushTip = (cssPoint, context) => {
  if (!cssPoint) return;
  const {
    getActiveCtx,
    toCanvasCoords,
    isErasing,
    canvasBlendMode,
    selectedAsset,
    stamp,
    gridSettings,
    canvasOpacity,
    brushSize,
    canvasColor,
    bufferWidth,
    bufferHeight,
  } = context;

  const ctx = getActiveCtx?.();
  if (!ctx) return;

  const rawPoint = toCanvasCoords(cssPoint.x, cssPoint.y);
  const p = gridSettings?.snapToGrid ? snapPointToTileCenter(rawPoint) : rawPoint;

  ctx.save();
  ctx.globalCompositeOperation = isErasing ? "destination-out" : canvasBlendMode || "source-over";
  ctx.globalAlpha = Math.max(
    0.01,
    selectedAsset?.kind === "image"
      ? (stamp?.opacity ?? gridSettings?.opacity ?? 1)
      : canvasOpacity
  );

  const radius = (brushSize * BASE_TILE) / 2;
  const bounds = getBrushCellBounds(p, radius, bufferWidth, bufferHeight);
  clipToGridCells(ctx, p, radius, bounds);

  if (selectedAsset?.kind === "image" && selectedAsset.img) {
    const img = selectedAsset.img;
    const { wTiles, hTiles } = resolveStampTiles(stamp, gridSettings, selectedAsset);
    const pxWidth = wTiles * BASE_TILE;
    const pxHeight = hTiles * BASE_TILE;
    const rot = (((stamp?.rotation ?? gridSettings?.rotation) || 0) * Math.PI) / 180;
    const scaleX = (stamp?.flipX ?? gridSettings?.flipX) ? -1 : 1;
    const scaleY = (stamp?.flipY ?? gridSettings?.flipY) ? -1 : 1;

    if (!bounds) {
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.clip();

    const stampOrigins = new Set();
    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      const startRow = row - (row % hTiles);
      for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
        const startCol = col - (col % wTiles);
        if (startCol < 0 || startRow < 0) continue;
        if (startCol + wTiles > bounds.cols || startRow + hTiles > bounds.rows) continue;
        stampOrigins.add(`${startCol}:${startRow}`);
      }
    }

    for (const origin of stampOrigins) {
      const [startCol, startRow] = origin.split(":").map(Number);
      const centerX = startCol * BASE_TILE + pxWidth / 2;
      const centerY = startRow * BASE_TILE + pxHeight / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rot);
      ctx.scale(scaleX, scaleY);
      if (!isErasing) {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(-pxWidth / 2, -pxHeight / 2, pxWidth, pxHeight);
        ctx.restore();
      }
      ctx.drawImage(img, 0, 0, img.width, img.height, -pxWidth / 2, -pxHeight / 2, pxWidth, pxHeight);
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
    return;
  }

  if (!canvasColor || selectedAsset?.kind !== "color") {
    ctx.restore();
    return;
  }

  ctx.fillStyle = hexToRgba(canvasColor, 1);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const stampBetweenCanvas = (a, b, context) => {
  const { brushSize, tileSize, canvasSpacing } = context;
  const radiusCss = (brushSize * tileSize) / 2;
  const spacing = Math.max(1, radiusCss * canvasSpacing);
  if (!a || !b) return a || b || null;
  const distance = dist(a, b);
  if (distance < spacing) return a;
  const steps = Math.ceil(distance / spacing);
  let last = a;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const point = lerp(a, b, t);
    paintBrushTip(point, context);
    last = point;
  }
  return last;
};
