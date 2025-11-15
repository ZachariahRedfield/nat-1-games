export function captureCanvasSnapshots(layerIds = [], canvasRefs = {}) {
  if (!layerIds?.length) return undefined;
  const snapshots = {};
  layerIds.forEach((layerId) => {
    const canvas = canvasRefs[layerId]?.current;
    if (!canvas) return;
    try {
      snapshots[layerId] = canvas.toDataURL();
    } catch (error) {
      // Ignore snapshot failures (e.g., tainted canvas)
    }
  });
  return Object.keys(snapshots).length ? snapshots : undefined;
}

export function restoreCanvasSnapshots(snapshots, canvasRefs = {}) {
  if (!snapshots || !Object.keys(snapshots).length) return;
  const scheduler =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (fn) => setTimeout(fn, 0);
  scheduler(() => {
    Object.entries(snapshots).forEach(([layerId, snapshot]) => {
      const canvas = canvasRefs[layerId]?.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = snapshot;
    });
  });
}
