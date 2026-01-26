import { useEffect, useRef } from "react";

function markLoadingComplete(ref) {
  setTimeout(() => {
    ref.current = false;
  }, 0);
}

export function useAssetGridDefaultsSync({ selectedAsset, setGridSettings, hasSelection }) {
  const loadingRef = useRef(false);

  useEffect(() => {
    if (hasSelection) return;
    if (!selectedAsset) return;
    const defaults = selectedAsset.stampDefaults || selectedAsset.defaults || {};
    loadingRef.current = true;
    setGridSettings((prev) => ({
      ...prev,
      sizeTiles: Number.isFinite(defaults.sizeTiles) ? defaults.sizeTiles : prev.sizeTiles ?? 1,
      sizeCols: Number.isFinite(defaults.sizeCols)
        ? defaults.sizeCols
        : Number.isFinite(defaults.sizeTiles)
          ? defaults.sizeTiles
          : prev.sizeCols ?? 1,
      sizeRows: Number.isFinite(defaults.sizeRows)
        ? defaults.sizeRows
        : Number.isFinite(defaults.sizeTiles)
          ? defaults.sizeTiles
          : prev.sizeRows ?? 1,
      rotation: Number.isFinite(defaults.rotation) ? defaults.rotation : prev.rotation ?? 0,
      flipX: defaults.flipX ?? prev.flipX ?? false,
      flipY: defaults.flipY ?? prev.flipY ?? false,
      opacity: Number.isFinite(defaults.opacity) ? defaults.opacity : prev.opacity ?? 1,
      snapToGrid: defaults.snapToGrid ?? prev.snapToGrid ?? true,
      snapStep: Number.isFinite(defaults.snapStep) ? defaults.snapStep : prev.snapStep ?? 1,
      linkXY: defaults.linkXY ?? prev.linkXY ?? false,
    }));
    markLoadingComplete(loadingRef);
  }, [hasSelection, selectedAsset, setGridSettings]);

  return loadingRef;
}

export function useAssetStampDefaultsSync({ selectedAsset, setAssetStamp, normalizeStamp }) {
  const loadingRef = useRef(false);

  useEffect(() => {
    const defaults = selectedAsset?.stampDefaults || selectedAsset?.defaults || {};
    loadingRef.current = true;
    setAssetStamp(normalizeStamp(defaults));
    markLoadingComplete(loadingRef);
  }, [normalizeStamp, selectedAsset, setAssetStamp]);

  return loadingRef;
}

export function useAssetNaturalDefaultsSync({
  selectedAssetId,
  getAsset,
  setNaturalSettings,
  normalizeNaturalSettings,
}) {
  const loadingRef = useRef(false);

  useEffect(() => {
    const asset = getAsset(selectedAssetId);
    if (!asset || asset.kind !== "natural") return;
    const defaults = asset.naturalDefaults || {};
    loadingRef.current = true;
    setNaturalSettings((current) => ({
      ...current,
      ...normalizeNaturalSettings(defaults),
    }));
    markLoadingComplete(loadingRef);
  }, [getAsset, normalizeNaturalSettings, selectedAssetId, setNaturalSettings]);

  return loadingRef;
}

export function useAssetCanvasBrushDefaultsSync({ selectedAssetId, getAsset, setBrushSize }) {
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!selectedAssetId) return;
    const asset = getAsset(selectedAssetId);
    if (!asset) return;
    const brushSize = asset.canvasBrushDefaults?.brushSize;
    loadingRef.current = true;
    setBrushSize((prev) => (Number.isFinite(brushSize) ? brushSize : prev));
    markLoadingComplete(loadingRef);
  }, [getAsset, selectedAssetId, setBrushSize]);

  return loadingRef;
}
