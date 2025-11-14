async function captureCanvasPNG(canvas) {
  if (!canvas) return null;
  try {
    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png");
    });
    return blob;
  } catch {
    return null;
  }
}

export async function capturePerLayerPNGs(canvasRefs) {
  const output = {};
  if (!canvasRefs) return output;
  const entries = Object.entries(canvasRefs);
  for (const [layerId, ref] of entries) {
    // eslint-disable-next-line no-await-in-loop
    const blob = await captureCanvasPNG(ref?.current);
    output[layerId] = blob;
  }
  return output;
}

export { captureCanvasPNG };
