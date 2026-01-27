import { useEffect, useMemo, useRef } from "react";

function buildPatchFromGridSettings(gridSettings) {
  if (!gridSettings) return {};
  const patch = {};
  const sizeCols = gridSettings.sizeCols;
  const sizeRows = gridSettings.sizeRows;
  const sizeTiles = gridSettings.sizeTiles;

  if (Number.isFinite(sizeCols)) patch.wTiles = sizeCols;
  if (Number.isFinite(sizeRows)) patch.hTiles = sizeRows;
  if (!Number.isFinite(sizeCols) && !Number.isFinite(sizeRows) && Number.isFinite(sizeTiles)) {
    patch.wTiles = sizeTiles;
    patch.hTiles = sizeTiles;
  }

  if (Number.isFinite(gridSettings.rotation)) patch.rotation = gridSettings.rotation;
  if (typeof gridSettings.flipX === "boolean") patch.flipX = gridSettings.flipX;
  if (typeof gridSettings.flipY === "boolean") patch.flipY = gridSettings.flipY;
  if (typeof gridSettings.opacity === "number") patch.opacity = gridSettings.opacity;
  if (typeof gridSettings.snapToGrid === "boolean") patch.snapToGrid = gridSettings.snapToGrid;
  if (typeof gridSettings.linkXY === "boolean") patch.linkXY = gridSettings.linkXY;

  return patch;
}

function buildDiffPatch(current, patch) {
  const diff = {};
  for (const [key, value] of Object.entries(patch)) {
    if (current?.[key] !== value) {
      diff[key] = value;
    }
  }
  return diff;
}

export function useSelectionSettingsPersistence({
  gridSettings,
  selectedObjsList,
  selectedTokensList,
  currentLayer,
  updateObjectById,
  updateTokenById,
  onBeginObjectStroke,
  onBeginTokenStroke,
}) {
  const selectionKey = useMemo(() => {
    const objectIds = (selectedObjsList || []).map((obj) => obj?.id).filter(Boolean).sort().join("|");
    const tokenIds = (selectedTokensList || []).map((token) => token?.id).filter(Boolean).sort().join("|");
    return `${currentLayer || "none"}::${objectIds}::${tokenIds}`;
  }, [currentLayer, selectedObjsList, selectedTokensList]);

  const previousSelectionKeyRef = useRef(null);

  useEffect(() => {
    if (selectionKey !== previousSelectionKeyRef.current) {
      previousSelectionKeyRef.current = selectionKey;
      return;
    }

    const patch = buildPatchFromGridSettings(gridSettings);
    if (!Object.keys(patch).length) return;

    if (Array.isArray(selectedObjsList) && selectedObjsList.length && currentLayer && updateObjectById) {
      let didBegin = false;
      selectedObjsList.forEach((obj) => {
        if (!obj?.id) return;
        const diff = buildDiffPatch(obj, patch);
        if (Object.keys(diff).length) {
          if (!didBegin) {
            onBeginObjectStroke?.(currentLayer);
            didBegin = true;
          }
          updateObjectById(currentLayer, obj.id, diff);
        }
      });
    }

    if (Array.isArray(selectedTokensList) && selectedTokensList.length && updateTokenById) {
      let didBegin = false;
      selectedTokensList.forEach((token) => {
        if (!token?.id) return;
        const diff = buildDiffPatch(token, patch);
        if (Object.keys(diff).length) {
          if (!didBegin) {
            onBeginTokenStroke?.();
            didBegin = true;
          }
          updateTokenById(token.id, diff);
        }
      });
    }
  }, [
    currentLayer,
    gridSettings,
    selectionKey,
    selectedObjsList,
    selectedTokensList,
    updateObjectById,
    updateTokenById,
    onBeginObjectStroke,
    onBeginTokenStroke,
  ]);
}

export default useSelectionSettingsPersistence;
