import { useCallback, useEffect, useMemo, useRef } from "react";

function useAssetSelection({
  assets,
  selectedAssetId,
  setSelectedAssetId,
  setCreatorOpen,
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
  setAssetGroup,
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

  const resolveGroupForAsset = useCallback((asset) => {
    if (!asset) return "image";
    if (asset.kind === "token" || asset.kind === "tokenGroup") return "token";
    if (asset.kind === "natural") return "natural";
    return "image";
  }, []);

  const applySelectionEffects = useCallback(
    (asset) => {
      if (!asset) return;
      setAssetGroup?.(resolveGroupForAsset(asset));

      if (asset.kind === "token" || asset.kind === "tokenGroup") {
        try {
          setZoomToolActive?.(false);
          setPanToolActive?.(false);
        } catch (err) {
          console.warn("Failed to disable zoom/pan tools", err);
        }
        setInteractionMode?.("draw");
        setEngine?.("grid");
        return;
      }

      if (asset.kind === "natural") {
        setEngine?.("grid");
        return;
      }

      if (asset.kind === "color") {
        if (asset.color) setCanvasColor?.(asset.color);
        return;
      }

      if (asset.allowedEngines?.length) {
        const preferred = asset.defaultEngine || asset.allowedEngines[0] || "canvas";
        if (asset.allowedEngines.includes(preferred)) {
          setEngine?.(preferred);
        } else {
          setEngine?.(asset.allowedEngines[0]);
        }
        return;
      }

      setEngine?.(asset.defaultEngine || "canvas");
    },
    [
      resolveGroupForAsset,
      setAssetGroup,
      setCanvasColor,
      setEngine,
      setInteractionMode,
      setPanToolActive,
      setZoomToolActive,
    ]
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
      applySelectionEffects(asset);
    },
    [applySelectionEffects, getAsset, selectedAssetId, setCreatorOpen, setSelectedAssetId]
  );

  useEffect(() => {
    if (!selectedAssetId && skipAutoSelectRef.current) {
      skipAutoSelectRef.current = false;
      return;
    }
    setCreatorOpen(false);

    const visibleAssets = assets.filter((asset) => asset && !asset.hiddenFromUI);
    let nextAsset = selectedAsset;
    if (!nextAsset && visibleAssets.length) {
      nextAsset = visibleAssets[0];
      setSelectedAssetId(nextAsset.id);
    }
    applySelectionEffects(nextAsset);
  }, [
    assets,
    applySelectionEffects,
    selectedAsset,
    selectedAssetId,
    setCreatorOpen,
    setSelectedAssetId,
  ]);

  return { getAsset, selectedAsset, selectAsset };
}

export { useAssetSelection };
