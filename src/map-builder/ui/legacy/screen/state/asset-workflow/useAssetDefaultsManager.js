import { useEffect, useRef } from "react";

function useAssetGridDefaultsSync({ selectedAsset, setGridSettings }) {
  const loadingRef = useRef(false);

  useEffect(() => {
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
    setTimeout(() => {
      loadingRef.current = false;
    }, 0);
  }, [selectedAsset, setGridSettings]);

  return loadingRef;
}

function useAssetStampDefaultsSync({ selectedAsset, setAssetStamp, normalizeStamp }) {
  const loadingRef = useRef(false);

  useEffect(() => {
    const defaults = selectedAsset?.stampDefaults || selectedAsset?.defaults || {};
    loadingRef.current = true;
    setAssetStamp(normalizeStamp(defaults));
    setTimeout(() => {
      loadingRef.current = false;
    }, 0);
  }, [normalizeStamp, selectedAsset, setAssetStamp]);

  return loadingRef;
}

function useAssetNaturalDefaultsSync({
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
    setTimeout(() => {
      loadingRef.current = false;
    }, 0);
  }, [getAsset, normalizeNaturalSettings, selectedAssetId, setNaturalSettings]);

  return loadingRef;
}

function usePersistAssetStampDefaults({
  selectedAssetId,
  assetStamp,
  getAsset,
  normalizeStamp,
  updateAssetById,
  loadingRef,
}) {
  useEffect(() => {
    if (!selectedAssetId || !assetStamp) return;
    if (loadingRef.current) return;

    const currentAsset = getAsset(selectedAssetId);
    const previousDefaults = currentAsset?.stampDefaults || {};
    const normalizedStamp = normalizeStamp(assetStamp);
    const same =
      previousDefaults &&
      previousDefaults.sizeTiles === normalizedStamp.sizeTiles &&
      previousDefaults.sizeCols === normalizedStamp.sizeCols &&
      previousDefaults.sizeRows === normalizedStamp.sizeRows &&
      previousDefaults.rotation === normalizedStamp.rotation &&
      !!previousDefaults.flipX === normalizedStamp.flipX &&
      !!previousDefaults.flipY === normalizedStamp.flipY &&
      Math.abs((previousDefaults.opacity ?? 1) - (normalizedStamp.opacity ?? 1)) < 0.0001 &&
      !!previousDefaults.snapToGrid === normalizedStamp.snapToGrid &&
      (previousDefaults.snapStep ?? 1) === normalizedStamp.snapStep &&
      !!previousDefaults.linkXY === normalizedStamp.linkXY;
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
    }
  }, [assetStamp, getAsset, loadingRef, normalizeStamp, selectedAssetId, updateAssetById]);
}

function usePersistGridDefaults({
  selectedAssetId,
  gridSettings,
  hasSelection,
  getAsset,
  normalizeStamp,
  setAssetStamp,
  updateAssetById,
  loadingRef,
}) {
  useEffect(() => {
    if (!selectedAssetId || !gridSettings) return;
    if (hasSelection) return;
    if (loadingRef.current) return;

    const currentAsset = getAsset(selectedAssetId);
    if (!currentAsset) return;

    const normalizedStamp = normalizeStamp(gridSettings);
    const previousDefaults = currentAsset.stampDefaults || {};
    const same =
      previousDefaults &&
      previousDefaults.sizeTiles === normalizedStamp.sizeTiles &&
      previousDefaults.sizeCols === normalizedStamp.sizeCols &&
      previousDefaults.sizeRows === normalizedStamp.sizeRows &&
      previousDefaults.rotation === normalizedStamp.rotation &&
      !!previousDefaults.flipX === normalizedStamp.flipX &&
      !!previousDefaults.flipY === normalizedStamp.flipY &&
      Math.abs((previousDefaults.opacity ?? 1) - (normalizedStamp.opacity ?? 1)) < 0.0001 &&
      !!previousDefaults.snapToGrid === normalizedStamp.snapToGrid &&
      (previousDefaults.snapStep ?? 1) === normalizedStamp.snapStep &&
      !!previousDefaults.linkXY === normalizedStamp.linkXY;
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
      setAssetStamp(normalizedStamp);
    }
  }, [getAsset, gridSettings, hasSelection, loadingRef, normalizeStamp, selectedAssetId, setAssetStamp, updateAssetById]);
}

function usePersistNaturalDefaults({
  selectedAssetId,
  naturalSettings,
  hasSelection,
  getAsset,
  normalizeNaturalSettings,
  updateAssetById,
  loadingRef,
}) {
  useEffect(() => {
    if (!selectedAssetId) return;
    if (hasSelection) return;
    if (loadingRef.current) return;

    const currentAsset = getAsset(selectedAssetId);
    if (!currentAsset || currentAsset.kind !== "natural") return;

    const normalized = normalizeNaturalSettings(naturalSettings);
    const previousDefaults = currentAsset.naturalDefaults || {};
    const same =
      !!previousDefaults &&
      !!previousDefaults.randomRotation === normalized.randomRotation &&
      !!previousDefaults.randomFlipX === normalized.randomFlipX &&
      !!previousDefaults.randomFlipY === normalized.randomFlipY &&
      !!(previousDefaults.randomSize?.enabled) === normalized.randomSize.enabled &&
      (previousDefaults.randomSize?.min ?? 1) === normalized.randomSize.min &&
      (previousDefaults.randomSize?.max ?? 1) === normalized.randomSize.max &&
      !!(previousDefaults.randomOpacity?.enabled) === normalized.randomOpacity.enabled &&
      (previousDefaults.randomOpacity?.min ?? 1) === normalized.randomOpacity.min &&
      (previousDefaults.randomOpacity?.max ?? 1) === normalized.randomOpacity.max &&
      (previousDefaults.randomVariant ?? true) === normalized.randomVariant;
    if (!same) {
      updateAssetById(selectedAssetId, { naturalDefaults: normalized });
    }
  }, [getAsset, hasSelection, loadingRef, naturalSettings, normalizeNaturalSettings, selectedAssetId, updateAssetById]);
}

export function useAssetDefaultsManager({
  selectedAsset,
  selectedAssetId,
  setGridSettings,
  gridSettings,
  hasSelection,
  getAsset,
  setAssetStamp,
  assetStamp,
  normalizeStamp,
  setNaturalSettings,
  naturalSettings,
  normalizeNaturalSettings,
  updateAssetById,
}) {
  const loadingGridDefaultsRef = useAssetGridDefaultsSync({ selectedAsset, setGridSettings });
  const loadingAssetStampDefaultsRef = useAssetStampDefaultsSync({
    selectedAsset,
    setAssetStamp,
    normalizeStamp,
  });
  const loadingNaturalDefaultsRef = useAssetNaturalDefaultsSync({
    selectedAssetId,
    getAsset,
    setNaturalSettings,
    normalizeNaturalSettings,
  });

  usePersistAssetStampDefaults({
    selectedAssetId,
    assetStamp,
    getAsset,
    normalizeStamp,
    updateAssetById,
    loadingRef: loadingAssetStampDefaultsRef,
  });

  usePersistGridDefaults({
    selectedAssetId,
    gridSettings,
    hasSelection,
    getAsset,
    normalizeStamp,
    setAssetStamp,
    updateAssetById,
    loadingRef: loadingGridDefaultsRef,
  });

  usePersistNaturalDefaults({
    selectedAssetId,
    naturalSettings,
    hasSelection,
    getAsset,
    normalizeNaturalSettings,
    updateAssetById,
    loadingRef: loadingNaturalDefaultsRef,
  });
}

export default useAssetDefaultsManager;
