import { useCallback, useState } from "react";

export function useSelectionState({
  objects,
  tokens,
  assets,
  currentLayer,
  dragRef,
  onSelectionChange,
  onTokenSelectionChange,
}) {
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedObjIds, setSelectedObjIds] = useState([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState([]);

  const getObjectById = useCallback(
    (layer, id) => (objects[layer] || []).find((o) => o.id === id),
    [objects]
  );

  const getTokenById = useCallback((id) => tokens.find((t) => t.id === id), [tokens]);

  const getAssetById = useCallback((id) => assets.find((a) => a.id === id), [assets]);

  const getSelectedObject = useCallback(() => {
    if (selectedObjId) return getObjectById(currentLayer, selectedObjId);
    if (selectedObjIds?.length === 1) return getObjectById(currentLayer, selectedObjIds[0]);
    return null;
  }, [currentLayer, getObjectById, selectedObjId, selectedObjIds]);

  const getSelectedToken = useCallback(() => {
    if (selectedTokenId) return getTokenById(selectedTokenId);
    if (selectedTokenIds?.length === 1) return getTokenById(selectedTokenIds[0]);
    return null;
  }, [getTokenById, selectedTokenId, selectedTokenIds]);

  const clearObjectSelection = useCallback(() => {
    setSelectedObjId(null);
    setSelectedObjIds([]);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const clearTokenSelection = useCallback(() => {
    setSelectedTokenId(null);
    setSelectedTokenIds([]);
    onTokenSelectionChange?.([]);
  }, [onTokenSelectionChange]);

  const clearSelections = useCallback(() => {
    clearObjectSelection();
    clearTokenSelection();
    if (dragRef) {
      dragRef.current = null;
    }
  }, [clearObjectSelection, clearTokenSelection, dragRef]);

  return {
    selectedObjId,
    selectedTokenId,
    selectedObjIds,
    selectedTokenIds,
    setSelectedObjId,
    setSelectedTokenId,
    setSelectedObjIds,
    setSelectedTokenIds,
    getObjectById,
    getTokenById,
    getAssetById,
    getSelectedObject,
    getSelectedToken,
    clearObjectSelection,
    clearTokenSelection,
    clearSelections,
  };
}

export default useSelectionState;
