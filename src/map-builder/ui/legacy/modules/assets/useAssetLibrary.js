import { useAssetCreationHandlers } from "./creation/useAssetCreationHandlers.js";
import { normalizeNaturalSettings, normalizeStamp } from "./config/assetDefaults.js";
import { useAssetLibraryState } from "./state/useAssetLibraryState.js";
import { useAssetPersistence } from "./state/useAssetPersistence.js";
import { useAssetSelection } from "./state/useAssetSelection.js";

export function useAssetLibrary({
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
  showToast,
}) {
  const state = useAssetLibraryState();

  const { promptChooseAssetsFolder } = useAssetPersistence({
    assets: state.assets,
    setAssets: state.setAssets,
    setNeedsAssetsFolder: state.setNeedsAssetsFolder,
    setSelectedAssetId: state.setSelectedAssetId,
    setAssetsFolderDialogOpen: state.setAssetsFolderDialogOpen,
    showToast,
  });

  const selection = useAssetSelection({
    assets: state.assets,
    assetGroup: state.assetGroup,
    selectedAssetId: state.selectedAssetId,
    setSelectedAssetId: state.setSelectedAssetId,
    setCreatorOpen: state.setCreatorOpen,
    setEngine,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
  });

  const creation = useAssetCreationHandlers({
    setAssets: state.setAssets,
    setSelectedAssetId: state.setSelectedAssetId,
    setAssetGroup: state.setAssetGroup,
    setEngine,
    setCreatorOpen: state.setCreatorOpen,
    setCreatorKind: state.setCreatorKind,
    setEditingAsset: state.setEditingAsset,
    newLabelText: state.newLabelText,
    setNewLabelText: state.setNewLabelText,
    newLabelColor: state.newLabelColor,
    newLabelFont: state.newLabelFont,
    newLabelSize: state.newLabelSize,
  });

  return {
    ...state,
    ...selection,
    ...creation,
    promptChooseAssetsFolder,
    normalizeStamp,
    normalizeNaturalSettings,
  };
}
