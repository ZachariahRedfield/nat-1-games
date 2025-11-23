import { useEffect } from "react";
import { clamp } from "../utils.js";

export function useObjectSelectionGridSync({
  gridSettings,
  selectedObjId,
  currentLayer,
  rows,
  cols,
  getObjectById,
  getAssetById,
  updateObjectById,
}) {
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
  }, [gridSettings, selectedTokenId, rows, cols, getTokenById, updateTokenById]);
}

export default useObjectSelectionGridSync;
