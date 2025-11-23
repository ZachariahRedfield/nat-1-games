import { useSelectionAssetGroupSync } from "./selectionAssetGroupSync.js";
import { useSelectionHotkeys } from "./selectionHotkeys.js";
import { useSelectionInteractionSync } from "./selectionInteractionSync.js";
import {
  useObjectSelectionGridSync,
  useTokenSelectionGridSync,
} from "./selectionGridSync.js";
import { useSelectionState } from "./selectionState.js";

export function useGridSelection({
  objects,
  tokens,
  assets,
  currentLayer,
  gridSettings,
  rows,
  cols,
  dragRef,
  assetGroup,
  interactionMode,
  onSelectionChange,
  onTokenSelectionChange,
  onBeginObjectStroke,
  onBeginTokenStroke,
  removeObjectById,
  removeTokenById,
  updateObjectById,
  updateTokenById,
}) {
  const selectionState = useSelectionState({
    objects,
    tokens,
    assets,
    currentLayer,
    dragRef,
    onSelectionChange,
    onTokenSelectionChange,
  });

  const {
    selectedObjId,
    selectedTokenId,
    selectedObjIds,
    selectedTokenIds,
    setSelectedObjId,
    setSelectedObjIds,
    setSelectedTokenId,
    setSelectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getObjectById,
    getTokenById,
    getAssetById,
    clearObjectSelection,
    clearTokenSelection,
    clearSelections,
  } = selectionState;

  useSelectionHotkeys({
    selectedObjId,
    selectedTokenId,
    selectedObjIds,
    selectedTokenIds,
    currentLayer,
    dragRef,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    clearObjectSelection,
    clearTokenSelection,
  });

  useSelectionAssetGroupSync({
    assetGroup,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    clearObjectSelection,
    clearTokenSelection,
  });

  useObjectSelectionGridSync({
    gridSettings,
    selectedObjId,
    currentLayer,
    rows,
    cols,
    getObjectById,
    getAssetById,
    updateObjectById,
  });

  useTokenSelectionGridSync({
    gridSettings,
    selectedTokenId,
    rows,
    cols,
    getTokenById,
    updateTokenById,
  });

  useSelectionInteractionSync({ interactionMode, clearSelections });

  return {
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    setSelectedObjId,
    setSelectedObjIds,
    setSelectedTokenId,
    setSelectedTokenIds,
    getSelectedObject,
    getSelectedToken,
    getObjectById,
    getTokenById,
    clearObjectSelection,
    clearTokenSelection,
    clearSelections,
  };
}

export default useGridSelection;
