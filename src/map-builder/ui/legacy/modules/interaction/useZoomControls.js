import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useZoomControls({ setTileSize }) {
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const [panToolActive, setPanToolActive] = useState(false);
  const zoomScrubRef = useRef(null);
  const zoomScrubStartY = useRef(0);
  const zoomScrubLastY = useRef(0);
  const zoomScrubTimerRef = useRef(null);
  const zoomScrubPosRef = useRef(0);
  const [zoomScrubPos, setZoomScrubPos] = useState(0);

  useEffect(() => {
    zoomScrubPosRef.current = zoomScrubPos;
  }, [zoomScrubPos]);

  const stopInterval = useCallback(() => {
    if (zoomScrubTimerRef.current) {
      clearInterval(zoomScrubTimerRef.current);
      zoomScrubTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Escape") {
        setZoomToolActive(false);
        setPanToolActive(false);
        stopInterval();
        setZoomScrubPos(0);
        zoomScrubPosRef.current = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stopInterval]);

  const handleZoomScrubStart = useCallback(
    (event) => {
      event?.preventDefault?.();
      const clientY = event?.clientY ?? event?.touches?.[0]?.clientY ?? 0;
      zoomScrubStartY.current = clientY;
      zoomScrubLastY.current = clientY;

      const updateVisualPos = (cy) => {
        const rect = zoomScrubRef.current?.getBoundingClientRect();
        if (!rect) return 0;
        const centerY = rect.top + rect.height / 2;
        const half = Math.max(1, rect.height / 2);
        const ratio = (cy - centerY) / half;
        const clamped = Math.max(-1, Math.min(1, ratio));
        setZoomScrubPos(clamped);
        zoomScrubPosRef.current = clamped;
        return clamped;
      };

      updateVisualPos(clientY);

      const startInterval = () => {
        if (zoomScrubTimerRef.current) return;
        zoomScrubTimerRef.current = window.setInterval(() => {
          const pos = zoomScrubPosRef.current || 0;
          if (!pos) return;

          setTileSize((size) => {
            let next = pos > 0 ? size + 2 : size - 2;
            next = Math.max(8, Math.min(128, next));
            return Math.round(next / 2) * 2;
          });
        }, 300);
      };

      startInterval();

      const onMove = (ev) => {
        const cy = ev?.clientY ?? ev?.touches?.[0]?.clientY ?? zoomScrubLastY.current;
        zoomScrubLastY.current = cy;
        updateVisualPos(cy);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
        stopInterval();
        setZoomScrubPos(0);
        zoomScrubPosRef.current = 0;
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove);
      window.addEventListener("touchend", onUp);
    },
    [setTileSize, stopInterval]
  );

  useEffect(() => () => stopInterval(), [stopInterval]);

  return useMemo(
    () => ({
      zoomToolActive,
      setZoomToolActive,
      panToolActive,
      setPanToolActive,
      zoomScrubRef,
      zoomScrubPos,
      handleZoomScrubStart,
    }),
    [zoomToolActive, panToolActive, zoomScrubPos, handleZoomScrubStart]
  );
}
