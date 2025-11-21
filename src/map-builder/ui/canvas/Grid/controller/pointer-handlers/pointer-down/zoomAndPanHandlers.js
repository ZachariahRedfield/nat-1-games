import { setPointerCapture } from "./pointerCapture.js";

export function beginZoomDrag({ event, pointer, refs, state }) {
  const { zoomDragRef } = refs;
  const { setMousePos } = state;
  const { xCss, yCss } = pointer;

  setMousePos({ x: xCss, y: yCss });
  const isLeft = event.button === 0 || (event.buttons & 1) === 1;
  if (!isLeft) return true;

  zoomDragRef.current = {
    kind: "marquee",
    startCss: { x: xCss, y: yCss },
    curCss: { x: xCss, y: yCss },
    lastCss: { x: xCss, y: yCss },
  };
  event.preventDefault();
  setPointerCapture(event);
  return true;
}

export function beginPan({ event, state }) {
  const { setIsPanning, setLastPan } = state;
  setIsPanning(true);
  setLastPan({ x: event.clientX, y: event.clientY });
  setPointerCapture(event);
  return true;
}
