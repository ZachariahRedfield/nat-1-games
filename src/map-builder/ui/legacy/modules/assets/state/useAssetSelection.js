import { useCallback, useEffect, useMemo, useRef } from "react";

function useAssetSelection({
  assets,
  assetGroup,
  selectedAssetId,
  setSelectedAssetId,
  setCreatorOpen,
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
}) {
  const skipAutoSelectRef = useRef(false);
  const getAsset = useCallback(
    (id) => assets.find((asset) => asset.id === id) || null,
    [assets]
  );

  const selectedAsset = useMemo(
    () => (selectedAssetId ? getAsset(selectedAssetId) : null),
    [getAsset, selectedAssetId]
  );

  const selectAsset = useCallback(
    (id) => {
      if (selectedAssetId && id === selectedAssetId) {
        skipAutoSelectRef.current = true;
        setSelectedAssetId(null);
        setCreatorOpen(false);
        return;
      }
      const asset = getAsset(id);
      setSelectedAssetId(id);
      setCreatorOpen(false);
      if (!asset) return;

      if (asset.kind === "token" || asset.kind === "tokenGroup") {
        try {
          setZoomToolActive?.(false);
          setPanToolActive?.(false);
        } catch (err) {
          console.warn("Failed to disable zoom/pan tools", err);
        }
        setInteractionMode?.("draw");
        setEngine?.("grid");
      } else if (asset.kind === "color") {
        if (asset.color) setCanvasColor?.(asset.color);
      } else if (asset.allowedEngines?.length) {
        const preferred = asset.defaultEngine || asset.allowedEngines[0] || "canvas";
        if (asset.allowedEngines.includes(preferred)) {
          setEngine?.(preferred);
        } else {
          setEngine?.(asset.allowedEngines[0]);
        }
      } else {
        setEngine?.(asset.defaultEngine || "canvas");
      }
    },
    [
      getAsset,
      selectedAssetId,
      setCanvasColor,
      setCreatorOpen,
      setEngine,
      setInteractionMode,
      setPanToolActive,
      setSelectedAssetId,
      setZoomToolActive,
    ]
  );

  useEffect(() => {
    if (!selectedAssetId && skipAutoSelectRef.current) {
      skipAutoSelectRef.current = false;
      return;
    }
    const ensureSelection = (predicate) => {
      const current = selectedAsset;
      if (current && predicate(current)) return current;
      const next = assets.find(predicate);
      if (next) {
        setSelectedAssetId(next.id);
        return next;
      }
      return null;
    };

    setCreatorOpen(false);

    if (assetGroup === "image") {
      const asset = ensureSelection((entry) => entry.kind === "image" || entry.kind === "color");
      if (asset?.kind === "color" && asset.color) {
        setCanvasColor?.(asset.color);
      }
    } else if (assetGroup === "material") {
      const material = ensureSelection((asset) => asset.kind === "color");
      if (material?.color) setCanvasColor?.(material.color);
      if (material?.allowedEngines?.length) {
        const preferred = material.defaultEngine || material.allowedEngines[0] || "canvas";
        setEngine?.(material.allowedEngines.includes(preferred) ? preferred : material.allowedEngines[0]);
      }
    } else if (assetGroup === "token") {
      ensureSelection((asset) => asset.kind === "token" || asset.kind === "tokenGroup");
      setEngine?.("grid");
    } else if (assetGroup === "natural") {
      ensureSelection((asset) => asset.kind === "natural");
      setEngine?.("grid");
    }
  }, [
    assetGroup,
    assets,
    selectedAsset,
    selectedAssetId,
    setCanvasColor,
    setCreatorOpen,
    setEngine,
    setSelectedAssetId,
  ]);

  return { getAsset, selectedAsset, selectAsset };
}

export { useAssetSelection };
