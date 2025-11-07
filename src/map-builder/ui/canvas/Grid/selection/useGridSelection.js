import { useCallback, useEffect, useState } from "react";
import { clamp } from "../utils.js";

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
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedObjIds, setSelectedObjIds] = useState([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState([]);

  const getObjectById = useCallback(
    (layer, id) => (objects[layer] || []).find((o) => o.id === id),
    [objects]
  );

  const getTokenById = useCallback(
    (id) => tokens.find((t) => t.id === id),
    [tokens]
  );

  const getAssetById = useCallback(
    (id) => assets.find((a) => a.id === id),
    [assets]
  );

  const getSelectedObject = useCallback(() => {
    if (selectedObjId) return getObjectById(currentLayer, selectedObjId);
    if (selectedObjIds?.length === 1)
      return getObjectById(currentLayer, selectedObjIds[0]);
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

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (
        target &&
        (target.isContentEditable === true ||
          (target.tagName &&
            (target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA" ||
              target.tagName === "SELECT")))
      ) {
        return;
      }

      if (selectedTokenIds.length || selectedTokenId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          onBeginTokenStroke?.();
          const ids =
            selectedTokenIds.length > 0
              ? selectedTokenIds
              : selectedTokenId
              ? [selectedTokenId]
              : [];
          ids.forEach((id) => removeTokenById?.(id));
          clearTokenSelection();
        } else if (e.key === "Escape") {
          clearTokenSelection();
          if (dragRef) dragRef.current = null;
        }
        return;
      }

      if (!(selectedObjIds.length || selectedObjId)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        onBeginObjectStroke?.(currentLayer);
        const ids =
          selectedObjIds.length > 0
            ? selectedObjIds
            : selectedObjId
            ? [selectedObjId]
            : [];
        ids.forEach((id) => removeObjectById(currentLayer, id));
        clearObjectSelection();
      } else if (e.key === "Escape") {
        clearObjectSelection();
        if (dragRef) dragRef.current = null;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedObjId,
    selectedTokenId,
    selectedObjIds,
    selectedTokenIds,
    currentLayer,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    clearObjectSelection,
    clearTokenSelection,
    dragRef,
  ]);

  useEffect(() => {
    if (assetGroup === "token") {
      if (selectedObjId || selectedObjIds.length) {
        clearObjectSelection();
      }
    } else {
      if (selectedTokenId || selectedTokenIds.length) {
        clearTokenSelection();
      }
    }
  }, [assetGroup, selectedObjId, selectedObjIds, selectedTokenId, selectedTokenIds, clearObjectSelection, clearTokenSelection]);

  useEffect(() => {
    if (!gridSettings || !selectedObjId) return;
    const obj = getObjectById(currentLayer, selectedObjId);
    if (!obj) return;

    const asset = getAssetById(obj.assetId);
    const aspect = asset?.aspectRatio || 1;

    let nextW = obj.wTiles;
    let nextH = obj.hTiles;
    const sc = gridSettings.sizeCols;
    const sr = gridSettings.sizeRows;
    const st = gridSettings.sizeTiles;

    if (typeof sc === "number" && sc >= 1) nextW = Math.max(1, Math.round(sc));
    if (typeof sr === "number" && sr >= 1) nextH = Math.max(1, Math.round(sr));

    if (
      (typeof sc !== "number" || sc < 1) &&
      (typeof sr !== "number" || sr < 1) &&
      typeof st === "number" &&
      st >= 1
    ) {
      nextW = Math.max(1, Math.round(st));
      nextH = Math.max(1, Math.round(nextW / aspect));
    }

    const centerRow = obj.row + obj.hTiles / 2;
    const centerCol = obj.col + obj.wTiles / 2;
    const step = gridSettings?.snapStep ?? 1;
    const snapLike =
      !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    let newRow = snapLike ? Math.round(centerRow - nextH / 2) : centerRow - nextH / 2;
    let newCol = snapLike ? Math.round(centerCol - nextW / 2) : centerCol - nextW / 2;
    newRow = clamp(newRow, 0, Math.max(0, rows - nextH));
    newCol = clamp(newCol, 0, Math.max(0, cols - nextW));

    updateObjectById(currentLayer, obj.id, {
      wTiles: nextW,
      hTiles: nextH,
      row: newRow,
      col: newCol,
      rotation: gridSettings.rotation || 0,
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
    });
  }, [
    gridSettings,
    selectedObjId,
    currentLayer,
    rows,
    cols,
    getObjectById,
    getAssetById,
    updateObjectById,
  ]);

  useEffect(() => {
    if (!gridSettings || !selectedTokenId) return;
    const token = getTokenById(selectedTokenId);
    if (!token) return;

    let wTiles = token.wTiles || 1;
    let hTiles = token.hTiles || 1;
    const sc = gridSettings.sizeCols;
    const sr = gridSettings.sizeRows;
    const st = gridSettings.sizeTiles;

    if (typeof sc === "number" && sc >= 1) wTiles = Math.max(1, Math.round(sc));
    if (typeof sr === "number" && sr >= 1) hTiles = Math.max(1, Math.round(sr));

    if (
      (typeof sc !== "number" || sc < 1) &&
      (typeof sr !== "number" || sr < 1) &&
      typeof st === "number" &&
      st >= 1
    ) {
      wTiles = Math.max(1, Math.round(st));
      hTiles = Math.max(1, Math.round(wTiles));
    }

    const centerRow = token.row + (token.hTiles || 1) / 2;
    const centerCol = token.col + (token.wTiles || 1) / 2;
    const step = gridSettings?.snapStep ?? 1;
    const snapLike =
      !!gridSettings?.snapToGrid || (!gridSettings?.snapToGrid && step === 1);
    let newRow = snapLike ? Math.round(centerRow - hTiles / 2) : centerRow - hTiles / 2;
    let newCol = snapLike ? Math.round(centerCol - wTiles / 2) : centerCol - wTiles / 2;
    newRow = clamp(newRow, 0, Math.max(0, rows - hTiles));
    newCol = clamp(newCol, 0, Math.max(0, cols - wTiles));

    updateTokenById?.(selectedTokenId, {
      wTiles,
      hTiles,
      row: newRow,
      col: newCol,
      rotation: gridSettings.rotation || 0,
      flipX: !!gridSettings.flipX,
      flipY: !!gridSettings.flipY,
      opacity: Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1)),
    });
  }, [
    gridSettings,
    selectedTokenId,
    rows,
    cols,
    getTokenById,
    updateTokenById,
  ]);

  useEffect(() => {
    if (interactionMode === "select") return;
    clearSelections();
  }, [interactionMode, clearSelections]);

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
