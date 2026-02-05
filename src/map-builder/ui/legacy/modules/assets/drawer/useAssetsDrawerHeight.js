import { useCallback, useEffect, useMemo, useState } from "react";

function readStoredHeight(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage?.getItem(storageKey);
    const numeric = Number(stored);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  } catch (error) {
    console.warn("Failed to read assets drawer height from storage", error);
  }
  return fallback;
}

function getViewportHeight() {
  if (typeof window === "undefined") return 800;
  return window.innerHeight || document.documentElement?.clientHeight || 800;
}

export function useAssetsDrawerHeight({ storageKey, initialHeight, minHeight, maxHeightPct }) {
  const minimumHeight = Math.max(0, minHeight || 0);
  const [height, setHeight] = useState(() => {
    const stored = readStoredHeight(storageKey, initialHeight);
    if (stored > minimumHeight) {
      const viewportHeight = getViewportHeight();
      const maximumHeight = Math.round(viewportHeight * (maxHeightPct || 1));
      return Math.max(minimumHeight, maximumHeight);
    }
    return minimumHeight;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage?.setItem(storageKey, String(height));
    } catch (error) {
      console.warn("Failed to persist assets drawer height", error);
    }
  }, [height, storageKey]);

  const computeExpandedHeight = useCallback(() => {
    const viewportHeight = getViewportHeight();
    const maximumHeight = Math.round(viewportHeight * (maxHeightPct || 1));
    return Math.max(minimumHeight, maximumHeight);
  }, [maxHeightPct, minimumHeight]);

  useEffect(() => {
    const maxHeight = computeExpandedHeight();
    setHeight((prev) => {
      if (!Number.isFinite(prev)) return minimumHeight;
      if (prev <= minimumHeight) return minimumHeight;
      if (prev > maxHeight) return maxHeight;
      return prev;
    });
  }, [computeExpandedHeight, minimumHeight]);

  const toggleDrawer = useCallback(() => {
    setHeight((prev) => {
      if (prev <= minimumHeight) {
        return computeExpandedHeight();
      }
      return minimumHeight;
    });
  }, [computeExpandedHeight, minimumHeight]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (height <= minimumHeight) return undefined;
    const handleResize = () => {
      setHeight(computeExpandedHeight());
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [computeExpandedHeight, height, minimumHeight]);

  const collapsed = useMemo(() => height <= minimumHeight, [height, minimumHeight]);

  return { height, collapsed, toggleDrawer };
}
