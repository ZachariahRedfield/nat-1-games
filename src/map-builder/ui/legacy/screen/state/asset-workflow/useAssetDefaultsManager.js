import {
  useAssetGridDefaultsSync,
  useAssetNaturalDefaultsSync,
  useAssetStampDefaultsSync,
} from "./defaults/assetDefaultsSync.js";
import {
  usePersistAssetStampDefaults,
  usePersistGridDefaults,
  usePersistNaturalDefaults,
} from "./defaults/assetDefaultsPersistence.js";

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
