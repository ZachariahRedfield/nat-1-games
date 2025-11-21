import { getPointerCssPosition } from "../gridPointerUtils.js";

export function handleZoomDrag({ refs, event, state }) {
  const { mouseDownRef, zoomDragRef } = refs;
  if (!state || !mouseDownRef.current) return true;
  const z = zoomDragRef.current;
  if (!z) return true;
  const pointer = getPointerCssPosition(event);
  z.curCss = { x: pointer.xCss, y: pointer.yCss };
  return true;
}

export function handlePan({ event, state, refs }) {
  const { lastPan, setLastPan, isPanning } = state;
  const { scrollRef } = refs;
  if (!isPanning || !lastPan || !scrollRef?.current) return false;

  const dx = event.clientX - lastPan.x;
  const dy = event.clientY - lastPan.y;
  scrollRef.current.scrollBy({ left: -dx, top: -dy });
  setLastPan({ x: event.clientX, y: event.clientY });
  return true;
}
