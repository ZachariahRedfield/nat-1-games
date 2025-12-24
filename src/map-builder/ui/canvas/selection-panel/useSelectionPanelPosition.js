import React from "react";

const PANEL_MARGIN = 8;
const PANEL_PADDING = 4;

const clamp = (value, min, max) => Math.min(Math.max(min, value), max);

const normalizeBounds = (bounds) => {
  const minX = Math.min(bounds.minX, bounds.maxX);
  const maxX = Math.max(bounds.minX, bounds.maxX);
  const minY = Math.min(bounds.minY, bounds.maxY);
  const maxY = Math.max(bounds.minY, bounds.maxY);
  return { minX, maxX, minY, maxY };
};

export function useSelectionPanelPosition({
  obj,
  tileSize,
  containerSize,
  panelSize,
  scrollRef,
  contentRef,
}) {
  const panelWidth = panelSize?.width ?? 0;
  const panelHeight = panelSize?.height ?? 0;
  const containerW = containerSize?.w ?? 0;
  const containerH = containerSize?.h ?? 0;

  const computeBounds = React.useCallback(() => {
    const fallbackMinX = PANEL_PADDING;
    const fallbackMinY = PANEL_PADDING;
    const fallbackMaxX = Math.max(fallbackMinX, containerW - panelWidth - PANEL_PADDING);
    const fallbackMaxY = Math.max(fallbackMinY, containerH - panelHeight - PANEL_PADDING);

    const scrollEl = scrollRef?.current;
    const contentEl = contentRef?.current;

    if (!scrollEl || !contentEl) {
      return {
        minX: fallbackMinX,
        maxX: fallbackMaxX,
        minY: fallbackMinY,
        maxY: fallbackMaxY,
      };
    }

    const scrollRect = scrollEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();
    const rawMinX = scrollRect.left - contentRect.left + PANEL_PADDING;
    const rawMinY = scrollRect.top - contentRect.top + PANEL_PADDING;
    const rawMaxX = scrollRect.right - contentRect.left - panelWidth - PANEL_PADDING;
    const rawMaxY = scrollRect.bottom - contentRect.top - panelHeight - PANEL_PADDING;

    return {
      minX: Math.min(fallbackMinX, rawMinX),
      maxX: Math.max(fallbackMaxX, rawMaxX),
      minY: Math.max(fallbackMinY, rawMinY),
      maxY: Math.max(fallbackMaxY, rawMaxY),
    };
  }, [containerH, containerW, panelHeight, panelWidth, scrollRef, contentRef]);

  const clampToBounds = React.useCallback(
    (x, y) => {
      const bounds = normalizeBounds(computeBounds());
      return {
        x: clamp(x, bounds.minX, bounds.maxX),
        y: clamp(y, bounds.minY, bounds.maxY),
      };
    },
    [computeBounds],
  );

  const bounds = React.useMemo(() => normalizeBounds(computeBounds()), [computeBounds]);

  const getAnchorPosition = React.useCallback(() => {
    const contentEl = contentRef?.current;
    const zoomControls = document.getElementById("layer-bar-zoom-controls");
    if (!contentEl || !zoomControls) return null;

    const contentRect = contentEl.getBoundingClientRect();
    const zoomRect = zoomControls.getBoundingClientRect();

    return {
      x: zoomRect.left - contentRect.left,
      y: zoomRect.bottom - contentRect.top + PANEL_MARGIN,
    };
  }, [contentRef]);

  const defaultPosition = React.useMemo(() => {
    const anchor = getAnchorPosition();
    if (anchor) {
      return clampToBounds(anchor.x, anchor.y);
    }

    return {
      x: bounds.minX,
      y: bounds.minY,
    };
  }, [bounds.minX, bounds.minY, clampToBounds, getAnchorPosition]);

  const [position, setPosition] = React.useState(defaultPosition);
  const movedRef = React.useRef(false);
  const prevObjIdRef = React.useRef(obj?.id ?? null);
  const dragStartRef = React.useRef(null);

  React.useEffect(() => {
    const currentId = obj?.id ?? null;
    if (prevObjIdRef.current !== currentId) {
      prevObjIdRef.current = currentId;
      movedRef.current = false;
    }

    if (!obj) {
      setPosition(defaultPosition);
      return;
    }

    if (movedRef.current) return;
    setPosition(defaultPosition);
  }, [defaultPosition, obj]);

  React.useEffect(() => {
    setPosition((prev) => {
      const next = clampToBounds(prev.x, prev.y);
      if (next.x === prev.x && next.y === prev.y) return prev;
      return next;
    });
  }, [clampToBounds]);

  const onDragMove = React.useCallback(
    (event) => {
      const start = dragStartRef.current;
      if (!start) return;
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;

      const dx = point.clientX - start.x;
      const dy = point.clientY - start.y;
      const next = clampToBounds(start.px + dx, start.py + dy);
      setPosition(next);
    },
    [clampToBounds],
  );

  const onDragEnd = React.useCallback(() => {
    dragStartRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  }, [onDragMove]);

  const onDragStart = React.useCallback(
    (event) => {
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;

      dragStartRef.current = {
        x: point.clientX,
        y: point.clientY,
        px: position.x,
        py: position.y,
      };
      movedRef.current = true;
      window.addEventListener("pointermove", onDragMove);
      window.addEventListener("pointerup", onDragEnd);
    },
    [onDragEnd, onDragMove, position.x, position.y],
  );

  React.useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onDragEnd);
    };
  }, [onDragEnd, onDragMove]);

  return { position, onDragStart };
}
