import { useCallback } from "react";
import { createRegenerateLabelInstance } from "./export/createRegenerateLabelInstance.js";
import { createSaveSelectionAsAsset } from "./export/createSaveSelectionAsAsset.js";
import { createSaveSelectedTokenAsAsset } from "./export/createSaveSelectedTokenAsAsset.js";
import { createSaveMultipleObjectsAsNaturalGroup } from "./export/createSaveMultipleObjectsAsNaturalGroup.js";
import { createSaveMultipleObjectsAsMergedImage } from "./export/createSaveMultipleObjectsAsMergedImage.js";
import { createSaveSelectedTokensAsGroup } from "./export/createSaveSelectedTokensAsGroup.js";
import { createSaveCurrentSelection } from "./export/createSaveCurrentSelection.js";

export function useAssetExports({
  assets,
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
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
}) {
  const regenerateLabelInstance = useCallback(
    createRegenerateLabelInstance({
      assets,
      selectedObj,
      setUndoStack,
      setRedoStack,
      currentLayer,
      objects,
      setAssets,
      updateObjectById,
    }),
    [assets, currentLayer, objects, selectedObj, setAssets, setRedoStack, setUndoStack, updateObjectById]
  );

  const saveSelectionAsAsset = useCallback(
    createSaveSelectionAsAsset({
      assets,
      selectedObj,
      tileSize,
      promptUser,
      setAssets,
      setSelectedAssetId,
      setAssetGroup,
      setEngine,
    }),
    [assets, promptUser, selectedObj, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveSelectedTokenAsAsset = useCallback(
    createSaveSelectedTokenAsAsset({
      assets,
      selectedToken,
      tileSize,
      promptUser,
      setAssets,
      setSelectedAssetId,
      setAssetGroup,
      setEngine,
    }),
    [assets, promptUser, selectedToken, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveMultipleObjectsAsNaturalGroup = useCallback(
    createSaveMultipleObjectsAsNaturalGroup({
      assets,
      tileSize,
      promptUser,
      setAssets,
      setSelectedAssetId,
      setAssetGroup,
      setEngine,
    }),
    [assets, promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveMultipleObjectsAsMergedImage = useCallback(
    createSaveMultipleObjectsAsMergedImage({
      assets,
      tileSize,
      promptUser,
      setAssets,
      setSelectedAssetId,
      setAssetGroup,
      setEngine,
    }),
    [assets, promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveSelectedTokensAsGroup = useCallback(
    createSaveSelectedTokensAsGroup({
      promptUser,
      setAssets,
      setSelectedAssetId,
      setAssetGroup,
      setEngine,
    }),
    [promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId]
  );

  const saveCurrentSelection = useCallback(
    createSaveCurrentSelection({
      confirmUser,
      saveMultipleObjectsAsMergedImage,
      saveMultipleObjectsAsNaturalGroup,
      saveSelectedTokenAsAsset,
      saveSelectedTokensAsGroup,
      saveSelectionAsAsset,
      selectedObjsList,
      selectedTokensList,
      showToast,
    }),
    [
      confirmUser,
      saveMultipleObjectsAsMergedImage,
      saveMultipleObjectsAsNaturalGroup,
      saveSelectedTokenAsAsset,
      saveSelectedTokensAsGroup,
      saveSelectionAsAsset,
      selectedObjsList,
      selectedTokensList,
      showToast,
    ]
  );

  return {
    regenerateLabelInstance,
    saveSelectionAsAsset,
    saveSelectedTokenAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokensAsGroup,
    saveCurrentSelection,
  };
}
