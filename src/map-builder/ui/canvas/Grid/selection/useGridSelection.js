import { useEffect, useMemo } from "react";
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
  selectedObjsList,
  selectedTokensList,
  allowInactiveSelection = false,
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

  const syncSelectionIds = (items) =>
    (Array.isArray(items) ? items.map((item) => item?.id).filter(Boolean) : []);

  const idsMatch = (left, right) => {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every((id) => rightSet.has(id));
  };

  const getActiveId = (ids) => (ids.length ? ids[ids.length - 1] : null);

  const externalObjIds = useMemo(() => syncSelectionIds(selectedObjsList), [selectedObjsList]);
  const externalTokenIds = useMemo(() => syncSelectionIds(selectedTokensList), [selectedTokensList]);

  useSelectionInteractionSync({ interactionMode, clearSelections, allowInactiveSelection });

  useEffect(() => {
    if (externalTokenIds.length) {
      if (!idsMatch(selectedTokenIds, externalTokenIds)) {
        setSelectedTokenIds(externalTokenIds);
      }
      const activeTokenId = getActiveId(externalTokenIds);
      if (selectedTokenId !== activeTokenId) {
        setSelectedTokenId(activeTokenId);
      }
      if (selectedObjIds.length || selectedObjId) {
        setSelectedObjIds([]);
        setSelectedObjId(null);
      }
      return;
    }

    if (externalObjIds.length) {
      if (!idsMatch(selectedObjIds, externalObjIds)) {
        setSelectedObjIds(externalObjIds);
      }
      const activeObjId = getActiveId(externalObjIds);
      if (selectedObjId !== activeObjId) {
        setSelectedObjId(activeObjId);
      }
      if (selectedTokenIds.length || selectedTokenId) {
        setSelectedTokenIds([]);
        setSelectedTokenId(null);
      }
      return;
    }

    if (selectedObjIds.length || selectedObjId) {
      setSelectedObjIds([]);
      setSelectedObjId(null);
    }
    if (selectedTokenIds.length || selectedTokenId) {
      setSelectedTokenIds([]);
      setSelectedTokenId(null);
    }
  }, [
    externalObjIds,
    externalTokenIds,
    selectedObjIds,
    selectedObjId,
    selectedTokenIds,
    selectedTokenId,
    setSelectedObjIds,
    setSelectedObjId,
    setSelectedTokenIds,
    setSelectedTokenId,
  ]);

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
    selectedObjIds,
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
