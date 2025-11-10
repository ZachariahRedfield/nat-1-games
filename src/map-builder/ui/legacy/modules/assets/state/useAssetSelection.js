import { useCallback, useEffect, useMemo } from "react";

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
    const ensureSelection = (predicate) => {
      const current = selectedAsset;
      if (current && predicate(current)) return;
      const next = assets.find(predicate);
      if (next) setSelectedAssetId(next.id);
    };

    setCreatorOpen(false);

    if (assetGroup === "image") {
      ensureSelection((asset) => asset.kind === "image");
    } else if (assetGroup === "material") {
      ensureSelection((asset) => asset.kind === "color");
    } else if (assetGroup === "token") {
      ensureSelection((asset) => asset.kind === "token" || asset.kind === "tokenGroup");
      setEngine?.("grid");
    } else if (assetGroup === "natural") {
      ensureSelection((asset) => asset.kind === "natural");
      setEngine?.("grid");
    }
  }, [assetGroup, assets, selectedAsset, setCreatorOpen, setEngine, setSelectedAssetId]);

  return { getAsset, selectedAsset, selectAsset };
}

export { useAssetSelection };
