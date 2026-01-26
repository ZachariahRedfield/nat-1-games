import { useEffect, useRef } from "react";
import {
  applyMultiSelectionUpdates,
  getCenteredPosition,
  getObjectSizeFromGrid,
  getSelectionIdsChange,
  isMultiSelectionNeutral,
  getTokenSizeFromGrid,
} from "./selectionGridSyncHelpers.js";

export function useObjectSelectionGridSync({
  gridSettings,
  selectedObjId,
  selectedObjIds = [],
  currentLayer,
  rows,
  cols,
  getObjectById,
  getAssetById,
  updateObjectById,
}) {
  const prevGridSettingsRef = useRef(gridSettings);
  const prevSelectedIdsRef = useRef(selectedObjIds);

  useEffect(() => {
    const hasSelection = Boolean(selectedObjId) || (Array.isArray(selectedObjIds) && selectedObjIds.length > 0);
    if (!gridSettings || !hasSelection) return;

    const { changed: selectionChanged, currentIds: currentSelectedIds } = getSelectionIdsChange(
      prevSelectedIdsRef.current,
      selectedObjIds,
    );

    if (selectionChanged) {
      prevSelectedIdsRef.current = currentSelectedIds;
      prevGridSettingsRef.current = gridSettings;
      return;
    }

    if (Array.isArray(selectedObjIds) && selectedObjIds.length > 1) {
      applyMultiSelectionUpdates({
        selectedObjIds,
        currentLayer,
        getObjectById,
        updateObjectById,
        gridSettings,
        prevGridSettings: prevGridSettingsRef.current,
      });

      prevGridSettingsRef.current = gridSettings;
      return;
    }

    if (isMultiSelectionNeutral(gridSettings)) {
      return;
    }

    const activeId = selectedObjId ?? selectedObjIds[0];
    const obj = getObjectById(currentLayer, activeId);
    if (!obj) return;

    const asset = getAssetById(obj.assetId);
    const aspect = asset?.aspectRatio || 1;

    const { nextW, nextH } = getObjectSizeFromGrid({ gridSettings, obj, aspect });

    const centerRow = obj.row + obj.hTiles / 2;
    const centerCol = obj.col + obj.wTiles / 2;
    const { newRow, newCol } = getCenteredPosition({
      centerRow,
      centerCol,
      nextW,
      nextH,
      rows,
      cols,
      snapToGrid: gridSettings?.snapToGrid,
    });

    const rotation = gridSettings.rotation || 0;
    const flipX = !!gridSettings.flipX;
    const flipY = !!gridSettings.flipY;
    const opacity = Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1));
    const linkXY = !!gridSettings.linkXY;

    if (
      obj.wTiles === nextW &&
      obj.hTiles === nextH &&
      obj.row === newRow &&
      obj.col === newCol &&
      (obj.rotation || 0) === rotation &&
      !!obj.flipX === flipX &&
      !!obj.flipY === flipY &&
      (obj.opacity ?? 1) === opacity &&
      !!obj.linkXY === linkXY
    ) {
      return;
    }

    updateObjectById(currentLayer, obj.id, {
      wTiles: nextW,
      hTiles: nextH,
      row: newRow,
      col: newCol,
      rotation,
      flipX,
      flipY,
      opacity,
      linkXY,
    });

    prevGridSettingsRef.current = gridSettings;
  }, [
    gridSettings,
    selectedObjId,
    selectedObjIds,
    currentLayer,
    rows,
    cols,
    getObjectById,
    getAssetById,
    updateObjectById,
  ]);
}

export function useTokenSelectionGridSync({
  gridSettings,
  selectedTokenId,
  rows,
  cols,
  getTokenById,
  updateTokenById,
}) {
  useEffect(() => {
    if (!gridSettings || !selectedTokenId) return;
    if (isMultiSelectionNeutral(gridSettings)) return;
    const token = getTokenById(selectedTokenId);
    if (!token) return;

    const { wTiles, hTiles } = getTokenSizeFromGrid({ gridSettings, token });

    const centerRow = token.row + (token.hTiles || 1) / 2;
    const centerCol = token.col + (token.wTiles || 1) / 2;
    const { newRow, newCol } = getCenteredPosition({
      centerRow,
      centerCol,
      nextW: wTiles,
      nextH: hTiles,
      rows,
      cols,
      snapToGrid: false,
    });
    const rotation = gridSettings.rotation || 0;
    const flipX = !!gridSettings.flipX;
    const flipY = !!gridSettings.flipY;
    const opacity = Math.max(0.05, Math.min(1, gridSettings.opacity ?? 1));

    if (
      (token.wTiles || 1) === wTiles &&
      (token.hTiles || 1) === hTiles &&
      token.row === newRow &&
      token.col === newCol &&
      (token.rotation || 0) === rotation &&
      !!token.flipX === flipX &&
      !!token.flipY === flipY &&
      (token.opacity ?? 1) === opacity
    ) {
      return;
    }

    updateTokenById?.(selectedTokenId, {
      wTiles,
      hTiles,
      row: newRow,
      col: newCol,
      rotation,
      flipX,
      flipY,
      opacity,
    });
  }, [gridSettings, selectedTokenId, rows, cols, getTokenById, updateTokenById]);
}

export default useObjectSelectionGridSync;
