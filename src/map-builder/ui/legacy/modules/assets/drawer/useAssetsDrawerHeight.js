import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function readStoredHeight(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage?.getItem(storageKey);
    const numeric = Number(stored);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  } catch (error) {
    console.warn("Failed to read assets drawer height from storage", error);
  }
  return fallback;
}

export function useAssetsDrawerHeight({ storageKey, initialHeight, minHeight, maxHeightPct }) {
  const resizeHandleRef = useRef(null);
  const pointerIdRef = useRef(null);
  const draggingRef = useRef(false);
  const [height, setHeight] = useState(() => readStoredHeight(storageKey, initialHeight));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage?.setItem(storageKey, String(height));
    } catch (error) {
      console.warn("Failed to persist assets drawer height", error);
    }
  }, [height, storageKey]);

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    const handle = resizeHandleRef.current;
    if (handle && pointerIdRef.current != null) {
      handle.releasePointerCapture?.(pointerIdRef.current);
    }
    pointerIdRef.current = null;
  }, []);

  useEffect(() => stopDragging, [stopDragging]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!draggingRef.current) return;
      const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 800;
      const maximumHeight = Math.round(viewportHeight * (maxHeightPct || 1));
      const minimumHeight = Math.max(0, minHeight || 0);
      const nextHeight = Math.min(
        maximumHeight,
        Math.max(minimumHeight, Math.round(viewportHeight - event.clientY))
      );
      setHeight(nextHeight);
    };

    const handlePointerUp = () => {
      stopDragging();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [maxHeightPct, minHeight, stopDragging]);

  const handleResizeStart = useCallback(
    (event) => {
      draggingRef.current = true;
      if (typeof document !== "undefined") {
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ns-resize";
      }
      resizeHandleRef.current = event.currentTarget;
      pointerIdRef.current = event.pointerId;
      event.currentTarget?.setPointerCapture?.(event.pointerId);
    },
    []
  );

  const collapsed = useMemo(() => height <= Math.max(0, minHeight || 0), [height, minHeight]);

  return { height, collapsed, handleResizeStart };
}
