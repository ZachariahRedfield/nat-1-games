import { useEffect } from "react";

function areStampDefaultsEqual(previousDefaults, normalizedStamp) {
  return (
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
    !!previousDefaults.linkXY === normalizedStamp.linkXY
  );
}

function areNaturalDefaultsEqual(previousDefaults, normalized) {
  return (
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
    (previousDefaults.randomVariant ?? true) === normalized.randomVariant
  );
}

export function usePersistAssetStampDefaults({
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
    const same = areStampDefaultsEqual(previousDefaults, normalizedStamp);
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
    }
  }, [assetStamp, getAsset, loadingRef, normalizeStamp, selectedAssetId, updateAssetById]);
}

export function usePersistGridDefaults({
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
    const same = areStampDefaultsEqual(previousDefaults, normalizedStamp);
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
      setAssetStamp(normalizedStamp);
    }
  }, [getAsset, gridSettings, hasSelection, loadingRef, normalizeStamp, selectedAssetId, setAssetStamp, updateAssetById]);
}

export function usePersistNaturalDefaults({
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
    const same = areNaturalDefaultsEqual(previousDefaults, normalized);
    if (!same) {
      updateAssetById(selectedAssetId, { naturalDefaults: normalized });
    }
  }, [getAsset, hasSelection, loadingRef, naturalSettings, normalizeNaturalSettings, selectedAssetId, updateAssetById]);
}
