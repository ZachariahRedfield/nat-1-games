function deriveCornerCursor(corner, rotation) {
  const baseAngle = corner === "nw" || corner === "se" ? 45 : 135;
  const raw = baseAngle + (rotation || 0);
  const normalized = ((raw % 180) + 180) % 180;

  if (normalized < 22.5 || normalized >= 157.5) {
    return "ns-resize";
  }

  if (normalized >= 67.5 && normalized < 112.5) {
    return "ew-resize";
  }

  if (normalized >= 22.5 && normalized < 67.5) {
    return corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
  }

  return corner === "nw" || corner === "se" ? "nesw-resize" : "nwse-resize";
}

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

  const gridCursor = "crosshair";

  if (!mousePos) {
    return zoomToolActive ? "zoom-in" : gridCursor;
  }

  const hit =
    hitResizeHandle(mousePos.x, mousePos.y) ||
    hitTokenResizeHandle(mousePos.x, mousePos.y);

  if (hit) {
    return deriveCornerCursor(hit.corner, hit.sel?.rotation || 0);
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
