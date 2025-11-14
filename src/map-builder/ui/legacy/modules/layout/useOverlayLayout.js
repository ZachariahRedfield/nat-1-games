import { useEffect, useMemo, useState } from "react";

function getScrollContainerMetrics(scrollEl) {
  if (!scrollEl) {
    return {
      boundingRect: null,
      offsetWidth: 0,
      clientWidth: 0,
    };
  }
  const rect = scrollEl.getBoundingClientRect();
  return {
    boundingRect: rect,
    offsetWidth: scrollEl.offsetWidth || rect.width || 0,
    clientWidth: scrollEl.clientWidth || rect.width || 0,
  };
}

export function useOverlayLayout({
  scrollRef,
  topControlsWrapRef,
  tileSize,
  rows,
  cols,
  menuOpen,
}) {
  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [overlayPosition, setOverlayPosition] = useState({ top: 40, left: 0, center: 0 });
  const [fixedLayerBar, setFixedLayerBar] = useState({ top: 0, left: 0, width: 0 });

  const fixedBarWidth = fixedLayerBar?.width ?? 0;

  useEffect(() => {
    const measureTopControlsHeight = () => {
      const el = topControlsWrapRef?.current;
      if (!el) {
        setTopControlsHeight(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const height = Math.max(0, Math.round(rect?.height || 0));
      setTopControlsHeight(height);
    };

    measureTopControlsHeight();
    window.addEventListener("resize", measureTopControlsHeight);
    return () => window.removeEventListener("resize", measureTopControlsHeight);
  }, [topControlsWrapRef, menuOpen, fixedBarWidth]);

  useEffect(() => {
    const measureOverlayAnchor = () => {
      const scrollEl = scrollRef?.current;
      if (!scrollEl) return;

      const rect = scrollEl.getBoundingClientRect();
      const insetTop = 2;
      const insetLeft = 8;
      const top = Math.round(rect.top + topControlsHeight + insetTop);
      const left = Math.round(rect.left + insetLeft);
      const center = Math.round(rect.left + rect.width / 2);

      setOverlayPosition({ top, left, center });
    };

    const requestDoubleFrame = () => requestAnimationFrame(() => requestAnimationFrame(measureOverlayAnchor));

    measureOverlayAnchor();
    const rafId = requestDoubleFrame();

    const scrollEl = scrollRef?.current;
    const onScroll = () => measureOverlayAnchor();

    scrollEl?.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);

    return () => {
      scrollEl?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [scrollRef, topControlsHeight, tileSize, rows, cols, menuOpen]);

  useEffect(() => {
    const measureFixedLayerBar = () => {
      const scrollEl = scrollRef?.current;
      if (!scrollEl) return;

      const { boundingRect, offsetWidth, clientWidth } = getScrollContainerMetrics(scrollEl);
      if (!boundingRect) return;

      const innerWidth = Math.max(0, Math.min(offsetWidth, clientWidth));
      setFixedLayerBar({
        top: Math.round(boundingRect.top),
        left: Math.round(boundingRect.left),
        width: Math.round(innerWidth),
      });
    };

    measureFixedLayerBar();
    window.addEventListener("resize", measureFixedLayerBar);
    const rafId = requestAnimationFrame(measureFixedLayerBar);

    return () => {
      window.removeEventListener("resize", measureFixedLayerBar);
      cancelAnimationFrame(rafId);
    };
  }, [scrollRef, menuOpen]);

  const overlayTop = overlayPosition?.top ?? 0;
  const overlayLeft = overlayPosition?.left ?? 0;
  const overlayCenter = overlayPosition?.center ?? 0;

  const fixedBarTop = fixedLayerBar?.top ?? 0;
  const fixedBarLeft = fixedLayerBar?.left ?? 0;
  return useMemo(
    () => ({
      topControlsHeight,
      overlayPosition,
      overlayTop,
      overlayLeft,
      overlayCenter,
      fixedLayerBar,
      fixedBarTop,
      fixedBarLeft,
      fixedBarWidth,
    }),
    [
      topControlsHeight,
      overlayPosition,
      overlayTop,
      overlayLeft,
      overlayCenter,
      fixedLayerBar,
      fixedBarTop,
      fixedBarLeft,
      fixedBarWidth,
    ]
  );
}
