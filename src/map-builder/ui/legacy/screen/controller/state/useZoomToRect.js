import { useCallback } from "react";

export function useZoomToRect({
  clamp,
  snap,
  tileSize,
  rows,
  cols,
  scrollRef,
  gridContentRef,
  setTileSize,
  setUndoStack,
  setRedoStack,
}) {
  return useCallback(
    ({ left, top, width, height, allowZoomOut = false }) => {
      const container = scrollRef.current;
      const content = gridContentRef.current;
      if (!container || !content) return;
      setUndoStack((prev) => [
        ...prev,
        { type: "view", tileSize, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop },
      ]);
      setRedoStack([]);

      const prevTileSize = tileSize;
      if (width < 8 || height < 8) return;

      let paddingTop = 0;
      let paddingBottom = 0;
      if (typeof window !== "undefined" && window.getComputedStyle) {
        const computedStyle = window.getComputedStyle(container);
        paddingTop = Number.parseFloat(computedStyle?.paddingTop ?? "0") || 0;
        paddingBottom = Number.parseFloat(computedStyle?.paddingBottom ?? "0") || 0;
      }

      const rawAvailableHeight = container.clientHeight - paddingTop - paddingBottom;
      const hasPositiveHeight = rawAvailableHeight > 0;
      const availableHeight = hasPositiveHeight ? rawAvailableHeight : container.clientHeight;
      const paddingOffset = hasPositiveHeight ? paddingTop : 0;

      const scaleX = container.clientWidth / width;
      const scaleY = availableHeight / height;
      const baseScale = Math.min(scaleX, scaleY);
      const marginFactor = baseScale > 1 ? 0.92 : 0.98;
      const targetScale = baseScale * marginFactor;
      let next = clamp(snap(prevTileSize * targetScale, 4), 8, 128);
      if (!allowZoomOut && next <= prevTileSize) {
        next = clamp(prevTileSize + 8, 8, 128);
      }

      const contentWidthPrev = cols * prevTileSize;
      const contentHeightPrev = rows * prevTileSize;
      let rx = (left + width / 2) / (contentWidthPrev || 1);
      let ry = (top + height / 2) / (contentHeightPrev || 1);
      rx = clamp(rx, 0, 1);
      ry = clamp(ry, 0, 1);

      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const contentOffsetLeft = contentRect.left - containerRect.left + container.scrollLeft;
      const contentOffsetTop = contentRect.top - containerRect.top + container.scrollTop;

      setTileSize(next);
      const centerAfterPaint = () => {
        const contentWidthNext = cols * next;
        const contentHeightNext = rows * next;
        const desiredLeft = contentOffsetLeft + rx * contentWidthNext - container.clientWidth / 2;
        const visibleCenterOffset = paddingOffset + availableHeight / 2;
        const desiredTop = contentOffsetTop + ry * contentHeightNext - visibleCenterOffset;
        const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
        container.scrollTo({
          left: clamp(desiredLeft, 0, maxLeft),
          top: clamp(desiredTop, 0, maxTop),
        });
      };
      requestAnimationFrame(() => requestAnimationFrame(centerAfterPaint));
    },
    [clamp, cols, gridContentRef, rows, scrollRef, setRedoStack, setTileSize, setUndoStack, snap, tileSize]
  );
}

export default useZoomToRect;
