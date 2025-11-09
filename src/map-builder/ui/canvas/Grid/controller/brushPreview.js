import { BASE_TILE, hexToRgba, dist, lerp } from "../utils.js";

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

  if (selectedAsset?.kind === "image" && selectedAsset.img) {
    const img = selectedAsset.img;
    const pxSize = brushSize * BASE_TILE;
    ctx.translate(p.x, p.y);
    const rot = (((stamp?.rotation ?? gridSettings?.rotation) || 0) * Math.PI) / 180;
    ctx.rotate(rot);
    ctx.scale((stamp?.flipX ?? gridSettings?.flipX) ? -1 : 1, (stamp?.flipY ?? gridSettings?.flipY) ? -1 : 1);
    ctx.drawImage(img, -pxSize / 2, -pxSize / 2, pxSize, pxSize);
    ctx.restore();
    return;
  }

  if (!canvasColor || selectedAsset?.kind !== "color") {
    ctx.restore();
    return;
  }

  ctx.fillStyle = hexToRgba(canvasColor, 1);
  ctx.beginPath();
  ctx.arc(p.x, p.y, (brushSize * BASE_TILE) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const stampBetweenCanvas = (a, b, context) => {
  const { brushSize, tileSize, canvasSpacing } = context;
  const radiusCss = (brushSize * tileSize) / 2;
  const spacing = Math.max(1, radiusCss * canvasSpacing);
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
