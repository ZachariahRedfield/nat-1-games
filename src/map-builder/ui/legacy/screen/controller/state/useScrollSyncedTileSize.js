import { useCallback } from "react";

export function useScrollSyncedTileSize({
  baseSetTileSize,
  scrollRef,
  gridContentRef,
  rows,
  cols,
}) {
  return useCallback(
    (valueOrUpdater) => {
      const scrollEl = scrollRef?.current;
      const contentEl = gridContentRef?.current;

      if (!scrollEl || !contentEl) {
        baseSetTileSize(valueOrUpdater);
        return;
      }

      baseSetTileSize((prev) => {
        const prevSize = Number(prev) || 0;
        const nextRaw =
          typeof valueOrUpdater === "function" ? valueOrUpdater(prevSize) : valueOrUpdater;
        const nextSize = Number(nextRaw);

        if (!Number.isFinite(nextSize) || nextSize <= 0) {
          return prev;
        }

        if (!Number.isFinite(prevSize) || prevSize <= 0 || nextSize === prevSize) {
          return nextSize;
        }

        const rowCount = Number(rows) || 0;
        const colCount = Number(cols) || 0;

        if (!rowCount || !colCount) {
          return nextSize;
        }

        const containerRect = scrollEl.getBoundingClientRect();
        const contentRect = contentEl.getBoundingClientRect();
        const contentOffsetLeft = contentRect.left - containerRect.left + scrollEl.scrollLeft;
        const contentOffsetTop = contentRect.top - containerRect.top + scrollEl.scrollTop;

        const prevContentWidth = colCount * prevSize;
        const prevContentHeight = rowCount * prevSize;

        if (!prevContentWidth || !prevContentHeight) {
          return nextSize;
        }

        const viewCenterX = scrollEl.scrollLeft + scrollEl.clientWidth / 2;
        const viewCenterY = scrollEl.scrollTop + scrollEl.clientHeight / 2;

        const ratioX = Math.max(
          0,
          Math.min(1, (viewCenterX - contentOffsetLeft) / prevContentWidth),
        );
        const ratioY = Math.max(
          0,
          Math.min(1, (viewCenterY - contentOffsetTop) / prevContentHeight),
        );

        const applyScroll = () => {
          const nextContentWidth = colCount * nextSize;
          const nextContentHeight = rowCount * nextSize;

          const desiredLeft =
            contentOffsetLeft + ratioX * nextContentWidth - scrollEl.clientWidth / 2;
          const desiredTop =
            contentOffsetTop + ratioY * nextContentHeight - scrollEl.clientHeight / 2;

          const minLeft = Math.max(0, contentOffsetLeft);
          const minTop = Math.max(0, contentOffsetTop);
          const maxLeft = Math.max(
            minLeft,
            contentOffsetLeft + nextContentWidth - scrollEl.clientWidth,
          );
          const maxTop = Math.max(
            minTop,
            contentOffsetTop + nextContentHeight - scrollEl.clientHeight,
          );

          const clampedLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
          const clampedTop = Math.max(minTop, Math.min(maxTop, desiredTop));

          scrollEl.scrollTo({ left: clampedLeft, top: clampedTop });
        };

        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => requestAnimationFrame(applyScroll));
        } else {
          setTimeout(applyScroll, 0);
        }

        return nextSize;
      });
    },
    [baseSetTileSize, cols, gridContentRef, rows, scrollRef],
  );
}

export default useScrollSyncedTileSize;
