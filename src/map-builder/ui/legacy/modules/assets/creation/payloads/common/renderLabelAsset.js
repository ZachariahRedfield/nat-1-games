const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export async function renderLabelAsset({ labelText, labelFont, labelColor, labelSize, fallbackAspectRatio, loadImage }) {
  const size = clamp(parseInt(labelSize, 10) || 28, 8, 128);
  const padding = Math.round(size * 0.35);
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `${size}px ${labelFont}`;
  const metrics = measureCtx.measureText(labelText);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(size * 1.2);
  const width = Math.max(1, textWidth + padding * 2);
  const height = Math.max(1, textHeight + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${size}px ${labelFont}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = labelColor;
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
  ctx.fillText(labelText, padding, padding);

  const src = canvas.toDataURL("image/png");
  const img = await loadImage(src);
  const aspectRatio = img.width && img.height ? img.width / img.height : fallbackAspectRatio ?? 1;

  return {
    src,
    img,
    aspectRatio,
    labelMeta: {
      text: labelText,
      color: labelColor,
      font: labelFont,
      size: labelSize,
    },
  };
}
