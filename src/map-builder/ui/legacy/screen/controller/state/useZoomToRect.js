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
    ({ left, top, width, height }) => {
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

      const scaleX = container.clientWidth / width;
      const scaleY = container.clientHeight / height;
      let next = clamp(snap(prevTileSize * Math.min(scaleX, scaleY), 4), 8, 128);
      if (next <= prevTileSize) {
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
        const desiredTop = contentOffsetTop + ry * contentHeightNext - container.clientHeight / 2;
        const minLeft = Math.max(0, contentOffsetLeft);
        const minTop = Math.max(0, contentOffsetTop);
        const maxLeft = Math.max(minLeft, contentOffsetLeft + contentWidthNext - container.clientWidth);
        const maxTop = Math.max(minTop, contentOffsetTop + contentHeightNext - container.clientHeight);
        container.scrollTo({
          left: clamp(desiredLeft, minLeft, maxLeft),
          top: clamp(desiredTop, minTop, maxTop),
        });
      };
      requestAnimationFrame(() => requestAnimationFrame(centerAfterPaint));
    },
    [clamp, cols, gridContentRef, rows, scrollRef, setRedoStack, setTileSize, setUndoStack, snap, tileSize]
  );
}

export default useZoomToRect;
