export function deriveCursorStyle({
  isPanning,
  panHotkey,
  panToolActive,
  dragRef,
  zoomToolActive,
  layerIsVisible,
  mousePos,
  engine,
  gridSettings,
  hitResizeHandle,
  hitTokenResizeHandle,
  hitRotateRing,
  hitTokenRotateRing,
}) {
  if (
    isPanning ||
    panHotkey ||
    (dragRef.current &&
      (dragRef.current.kind === "rotate-obj" || dragRef.current.kind === "rotate-token"))
  ) {
    return "grabbing";
  }

  if (panToolActive) {
    return "grab";
  }

  if (!layerIsVisible) {
    return "not-allowed";
  }

  const gridCursor = engine === "grid" ? (gridSettings?.snapToGrid ? "cell" : "crosshair") : "crosshair";

  if (!mousePos) {
    return zoomToolActive ? "zoom-in" : gridCursor;
  }

  const hit =
    hitResizeHandle(mousePos.x, mousePos.y) ||
    hitTokenResizeHandle(mousePos.x, mousePos.y);

  if (hit) {
    return hit.corner === "nw" || hit.corner === "se" ? "nwse-resize" : "nesw-resize";
  }

  const ring =
    hitRotateRing(mousePos.x, mousePos.y) ||
    hitTokenRotateRing(mousePos.x, mousePos.y);

  if (ring) {
    return "grab";
  }

  if (zoomToolActive) {
    return "zoom-in";
  }

  return gridCursor;
}

export default deriveCursorStyle;
