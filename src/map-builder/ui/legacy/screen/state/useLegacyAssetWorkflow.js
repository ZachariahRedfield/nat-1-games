import { useAssetLibrary } from "../../modules/assets/useAssetLibrary.js";
import { useAssetExports } from "../../modules/assets/useAssetExports.js";
import { useAssetBrushSettings } from "./asset-workflow/useAssetBrushSettings.js";
import { useAssetDefaultsManager } from "./asset-workflow/useAssetDefaultsManager.js";
import { useAssetSelectionSafety } from "./asset-workflow/useAssetSelectionSafety.js";

export function useLegacyAssetWorkflow({
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
  interactionMode,
  gridSettings,
  setGridSettings,
  hasSelection,
  showToast,
  promptUser,
  confirmUser,
  setUndoStack,
  setRedoStack,
  updateObjectById,
  currentLayer,
  tileSize,
  objects,
  selectedObj,
  selectedObjsList,
  selectedToken,
  selectedTokensList,
  setSelectedToken,
}) {
  const assetLibrary = useAssetLibrary({
    setEngine,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
    showToast,
  });

  const brushSettings = useAssetBrushSettings();

  useAssetDefaultsManager({
    selectedAsset: assetLibrary.selectedAsset,
    selectedAssetId: assetLibrary.selectedAssetId,
    setGridSettings,
    gridSettings,
    hasSelection,
    getAsset: assetLibrary.getAsset,
    setAssetStamp: assetLibrary.setAssetStamp,
    assetStamp: assetLibrary.assetStamp,
    normalizeStamp: assetLibrary.normalizeStamp,
    setNaturalSettings: assetLibrary.setNaturalSettings,
    naturalSettings: assetLibrary.naturalSettings,
    normalizeNaturalSettings: assetLibrary.normalizeNaturalSettings,
    updateAssetById: assetLibrary.updateAssetById,
    brushSize: brushSettings.brushSize,
    setBrushSize: brushSettings.setBrushSize,
  });

  useAssetSelectionSafety({
    assetGroup: assetLibrary.assetGroup,
    interactionMode,
    selectedToken,
    setSelectedToken,
  });

  const assetExports = useAssetExports({
    assets: assetLibrary.assets,
    setAssets: assetLibrary.setAssets,
    setSelectedAssetId: assetLibrary.setSelectedAssetId,
    setAssetGroup: assetLibrary.setAssetGroup,
    setEngine,
    selectedObj,
    selectedObjsList,
    selectedToken,
    selectedTokensList,
    updateObjectById,
    currentLayer,
    tileSize,
    promptUser,
    confirmUser,
    showToast,
    setUndoStack,
    setRedoStack,
    objects,
  });

  return {
    ...assetLibrary,
    ...brushSettings,
    ...assetExports,
  };
}

export default useLegacyAssetWorkflow;
