import { useEffect, useRef } from "react";
import { clamp } from "../utils.js";

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
    if (!gridSettings || !selectedObjId) return;
    const obj = getObjectById(currentLayer, selectedObjId);
    if (!obj) return;

    const prevSelectedIds = Array.isArray(prevSelectedIdsRef.current) ? prevSelectedIdsRef.current : [];
    const currentSelectedIds = Array.isArray(selectedObjIds) ? selectedObjIds : [];
    const selectionChanged =
      prevSelectedIds.length !== currentSelectedIds.length ||
      prevSelectedIds.some((id, index) => id !== currentSelectedIds[index]);

    if (selectionChanged) {
      prevSelectedIdsRef.current = currentSelectedIds;
      // Establish a neutral baseline when switching selection groups so multi-edit deltas always start at zero.
      prevGridSettingsRef.current =
        currentSelectedIds.length > 1
          ? {
              ...gridSettings,
              sizeCols: 0,
              sizeRows: 0,
              sizeTiles: 0,
              rotation: 0,
              opacity: 0,
              flipX: false,
              flipY: false,
            }
          : gridSettings;
    }

    if (Array.isArray(selectedObjIds) && selectedObjIds.length > 1) {
      const prev = prevGridSettingsRef.current || {};
      const rawDeltaSizeCols =
        typeof gridSettings.sizeCols === "number" ? (gridSettings.sizeCols || 0) - (prev.sizeCols || 0) : 0;
      const rawDeltaSizeRows =
        typeof gridSettings.sizeRows === "number" ? (gridSettings.sizeRows || 0) - (prev.sizeRows || 0) : 0;
      const deltaRotation =
        typeof gridSettings.rotation === "number" ? (gridSettings.rotation || 0) - (prev.rotation || 0) : 0;
      const deltaOpacity =
        typeof gridSettings.opacity === "number" ? (gridSettings.opacity || 0) - (prev.opacity || 0) : 0;
      const flipXChanged = typeof gridSettings.flipX === "boolean" && gridSettings.flipX !== prev.flipX;
      const flipYChanged = typeof gridSettings.flipY === "boolean" && gridSettings.flipY !== prev.flipY;

      const hasDelta =
        rawDeltaSizeCols ||
        rawDeltaSizeRows ||
        deltaRotation ||
        deltaOpacity ||
        flipXChanged ||
        flipYChanged;

      if (hasDelta) {
        for (const id of selectedObjIds) {
          const current = getObjectById(currentLayer, id);
          if (!current) continue;

          const linkXY = !!current.linkXY;
          const uiLinked = !!gridSettings?.linkXY;
          const primaryDelta = linkXY ? rawDeltaSizeCols || rawDeltaSizeRows : null;

          const widthDelta = linkXY ? primaryDelta ?? 0 : rawDeltaSizeCols;
          let heightDelta;
          if (linkXY) {
            heightDelta = primaryDelta ?? 0;
          } else if (uiLinked && !linkXY && rawDeltaSizeCols && rawDeltaSizeCols === rawDeltaSizeRows) {
            // The settings UI mirrors values when its link toggle is on; respect per-object link flags by
            // ignoring mirrored height deltas for unlinked assets.
            heightDelta = 0;
          } else {
            heightDelta = rawDeltaSizeRows;
          }

          const wTiles = Math.max(1, Math.round((current.wTiles || 1) + widthDelta));
          const hTiles = Math.max(1, Math.round((current.hTiles || 1) + heightDelta));
          const rotation = ((current.rotation || 0) + deltaRotation + 360) % 360;
          const opacity = Math.max(0.05, Math.min(1, (current.opacity ?? 1) + deltaOpacity));

          updateObjectById(currentLayer, current.id, {
            wTiles,
            hTiles,
            rotation,
            flipX: flipXChanged ? !!gridSettings.flipX : current.flipX,
            flipY: flipYChanged ? !!gridSettings.flipY : current.flipY,
            opacity,
            linkXY: current.linkXY,
          });
        }
      }

      prevGridSettingsRef.current = gridSettings;
      return;
    }

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
    let newRow = centerRow - nextH / 2;
    let newCol = centerCol - nextW / 2;

    newRow = clamp(newRow, 0, Math.max(0, rows - nextH));
    newCol = clamp(newCol, 0, Math.max(0, cols - nextW));

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
    const newRow = clamp(centerRow - hTiles / 2, 0, Math.max(0, rows - hTiles));
    const newCol = clamp(centerCol - wTiles / 2, 0, Math.max(0, cols - wTiles));
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
