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
    const count = Array.isArray(selectedObjIds) ? selectedObjIds.length : 0;
    if (count !== 1) return null;
    const id = selectedObjId ?? selectedObjIds[0];
    return id ? getObjectById(currentLayer, id) : null;
  }, [currentLayer, getObjectById, selectedObjId, selectedObjIds]);

  const getSelectedToken = useCallback(() => {
    const count = Array.isArray(selectedTokenIds) ? selectedTokenIds.length : 0;
    if (count !== 1) return null;
    const id = selectedTokenId ?? selectedTokenIds[0];
    return id ? getTokenById(id) : null;
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
