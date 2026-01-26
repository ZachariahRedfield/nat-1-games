import {
  useAssetGridDefaultsSync,
  useAssetNaturalDefaultsSync,
  useAssetStampDefaultsSync,
  useAssetCanvasBrushDefaultsSync,
} from "./defaults/assetDefaultsSync.js";
import {
  usePersistAssetStampDefaults,
  usePersistCanvasBrushDefaults,
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
  brushSize,
  setBrushSize,
}) {
  const loadingGridDefaultsRef = useAssetGridDefaultsSync({ selectedAsset, setGridSettings, hasSelection });
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
  const loadingCanvasBrushDefaultsRef = useAssetCanvasBrushDefaultsSync({
    selectedAssetId,
    getAsset,
    setBrushSize,
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

  usePersistCanvasBrushDefaults({
    selectedAssetId,
    brushSize,
    getAsset,
    updateAssetById,
    loadingRef: loadingCanvasBrushDefaultsRef,
  });
}

export default useAssetDefaultsManager;
