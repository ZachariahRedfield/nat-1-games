import { BASE_TILE, clamp, hexToRgba, dist, lerp } from "../utils.js";

const clipToGridCells = (ctx, point, radius, bufferWidth, bufferHeight) => {
  const cols = bufferWidth > 0 ? Math.floor(bufferWidth / BASE_TILE) : 0;
  const rows = bufferHeight > 0 ? Math.floor(bufferHeight / BASE_TILE) : 0;
  if (!cols || !rows) return;

  const minCol = Math.max(0, Math.floor((point.x - radius) / BASE_TILE));
  const maxCol = Math.min(cols - 1, Math.floor((point.x + radius) / BASE_TILE));
  const minRow = Math.max(0, Math.floor((point.y - radius) / BASE_TILE));
  const maxRow = Math.min(rows - 1, Math.floor((point.y + radius) / BASE_TILE));

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

  const p = toCanvasCoords(cssPoint.x, cssPoint.y);

  ctx.save();
  ctx.globalCompositeOperation = isErasing ? "destination-out" : canvasBlendMode || "source-over";
  ctx.globalAlpha = Math.max(
    0.01,
    selectedAsset?.kind === "image"
      ? (stamp?.opacity ?? gridSettings?.opacity ?? 1)
      : canvasOpacity
  );

  const radius = (brushSize * BASE_TILE) / 2;
  clipToGridCells(ctx, p, radius, bufferWidth, bufferHeight);

  if (selectedAsset?.kind === "image" && selectedAsset.img) {
    const img = selectedAsset.img;
    const pxSize = brushSize * BASE_TILE;
    const half = pxSize / 2;
    const destLeft = p.x - half;
    const destTop = p.y - half;

    const scaleX = bufferWidth > 0 ? img.width / bufferWidth : 1;
    const scaleY = bufferHeight > 0 ? img.height / bufferHeight : 1;
    const srcX = Math.max(0, Math.min(img.width, destLeft * scaleX));
    const srcY = Math.max(0, Math.min(img.height, destTop * scaleY));
    const srcW = Math.max(0, Math.min(img.width - srcX, pxSize * scaleX));
    const srcH = Math.max(0, Math.min(img.height - srcY, pxSize * scaleY));

    ctx.translate(p.x, p.y);
    const rot = (((stamp?.rotation ?? gridSettings?.rotation) || 0) * Math.PI) / 180;
    ctx.rotate(rot);
    ctx.scale((stamp?.flipX ?? gridSettings?.flipX) ? -1 : 1, (stamp?.flipY ?? gridSettings?.flipY) ? -1 : 1);
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    ctx.clip();
    if (!isErasing) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(-half, -half, pxSize, pxSize);
      ctx.restore();
    }
    ctx.drawImage(img, srcX, srcY, srcW, srcH, -half, -half, pxSize, pxSize);
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
  const spacing = Math.max(1, radiusCss, radiusCss * canvasSpacing);
  const distance = dist(a, b);
  if (distance <= spacing) {
    paintBrushTip(b, context);
    return;
  }
  const steps = Math.ceil(distance / spacing);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    paintBrushTip(lerp(a, b, t), context);
  }
};
