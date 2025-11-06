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
  const output = { background: null, base: null, sky: null };
  if (!canvasRefs) return output;
  const layers = ["background", "base", "sky"];
  for (const layer of layers) {
    const canvas = canvasRefs?.[layer]?.current;
    // eslint-disable-next-line no-await-in-loop
    const blob = await captureCanvasPNG(canvas);
    output[layer] = blob;
  }
  return output;
}

export { captureCanvasPNG };
