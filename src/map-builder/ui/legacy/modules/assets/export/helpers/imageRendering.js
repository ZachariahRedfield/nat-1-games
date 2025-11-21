export function drawImageWithTransforms(ctx, image, {
  centerX,
  centerY,
  widthPx,
  heightPx,
  rotation = 0,
  flipX = false,
  flipY = false,
  opacity = 1,
}) {
  ctx.save();
  ctx.translate(centerX, centerY);
  const rot = (rotation * Math.PI) / 180;
  ctx.rotate(rot);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.globalAlpha = opacity ?? 1;
  ctx.drawImage(image, -widthPx / 2, -heightPx / 2, widthPx, heightPx);
  ctx.restore();
}

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

export async function renderToDataUrl({
  src,
  widthPx,
  heightPx,
  rotation = 0,
  flipX = false,
  flipY = false,
  opacity = 1,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  const image = await loadImage(src);
  drawImageWithTransforms(ctx, image, {
    centerX: widthPx / 2,
    centerY: heightPx / 2,
    widthPx,
    heightPx,
    rotation,
    flipX,
    flipY,
    opacity,
  });
  return canvas.toDataURL("image/png");
}
