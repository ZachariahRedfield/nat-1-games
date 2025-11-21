import { useCallback, useState } from "react";
import useGlobalPointerRelease from "../useGlobalPointerRelease.js";

const DEFAULT_TILE_RESET = { row: -1, col: -1 };

export function usePointerLifecycle({
  mouseDownRef,
  lastStampCssRef,
  emaCssRef,
  lastTileRef,
}) {
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  const resetPointerState = useCallback(() => {
    if (mouseDownRef) mouseDownRef.current = false;
    setIsBrushing(false);
    setIsPanning(false);
    setLastPan(null);
    if (lastStampCssRef) lastStampCssRef.current = null;
    if (emaCssRef) emaCssRef.current = null;
    if (lastTileRef) lastTileRef.current = { ...DEFAULT_TILE_RESET };
  }, [mouseDownRef, lastStampCssRef, emaCssRef, lastTileRef]);

  useGlobalPointerRelease(resetPointerState);

  return {
    isPanning,
    setIsPanning,
    lastPan,
    setLastPan,
    isBrushing,
    setIsBrushing,
    mousePos,
    setMousePos,
    resetPointerState,
  };
}

export default usePointerLifecycle;
