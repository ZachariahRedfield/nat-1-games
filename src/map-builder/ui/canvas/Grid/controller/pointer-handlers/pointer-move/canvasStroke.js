import { clamp } from "../../../utils.js";
import { getPointerCssPosition } from "../gridPointerUtils.js";

export function handleCanvasStroke({ event, refs, config, data }) {
  if (!refs.lastStampCssRef || !refs.emaCssRef) return true;
  if (!data.paintTipAt || !data.stampBetweenCanvas) return true;
  const pointer = getPointerCssPosition(event);
  const native = event.nativeEvent;
  const events = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [native];
  const alpha = clamp(config.canvasSmoothing ?? 0.55, 0.01, 0.99);

  let last = refs.lastStampCssRef.current;
  let ema = refs.emaCssRef.current || last;

  for (const ev of events) {
    const px = ev.clientX - pointer.rect.left;
    const py = ev.clientY - pointer.rect.top;

    if (!last || !ema) {
      const init = { x: px, y: py };
      refs.lastStampCssRef.current = init;
      refs.emaCssRef.current = init;
      data.paintTipAt(init);
      continue;
    }

    ema = {
      x: ema.x + (px - ema.x) * alpha,
      y: ema.y + (py - ema.y) * alpha,
    };
    data.stampBetweenCanvas(last, ema);
    last = ema;
  }

  refs.lastStampCssRef.current = last;
  refs.emaCssRef.current = ema;
  return true;
}
