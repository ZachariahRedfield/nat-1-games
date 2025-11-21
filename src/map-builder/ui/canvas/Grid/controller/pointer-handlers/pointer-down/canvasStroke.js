export function beginCanvasStroke({ pointer, refs, state, callbacks, config, data }) {
  const { onBeginCanvasStroke } = callbacks;
  const { currentLayer } = config;
  const { setIsBrushing } = state;
  const { emaCssRef, lastStampCssRef } = refs;
  const { paintTipAt } = data;

  onBeginCanvasStroke?.(currentLayer);
  setIsBrushing(true);

  const start = { x: pointer.xCss, y: pointer.yCss };
  if (emaCssRef) emaCssRef.current = start;
  if (lastStampCssRef) lastStampCssRef.current = start;
  paintTipAt(start);
  return true;
}
