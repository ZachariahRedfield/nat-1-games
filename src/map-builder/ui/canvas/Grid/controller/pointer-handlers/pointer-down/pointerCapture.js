export function setPointerCapture(event) {
  event.target.setPointerCapture?.(event.pointerId);
}
