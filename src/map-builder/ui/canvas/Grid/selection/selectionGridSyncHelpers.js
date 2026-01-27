import { clamp } from "../utils.js";

export const getSelectionIdsChange = (prevSelectedIds, currentSelectedIds) => {
  const prevIds = Array.isArray(prevSelectedIds) ? prevSelectedIds : [];
  const currentIds = Array.isArray(currentSelectedIds) ? currentSelectedIds : [];
  const changed =
    prevIds.length !== currentIds.length || prevIds.some((id, index) => id !== currentIds[index]);

  return { changed, prevIds, currentIds };
};

export const getMultiSelectionUpdates = (gridSettings, prevGridSettings) => {
  const next = gridSettings || {};
  const prev = prevGridSettings || {};
  const updates = {};

  if (typeof next.sizeCols === "number" && next.sizeCols !== prev.sizeCols) {
    updates.sizeCols = next.sizeCols;
  }
  if (typeof next.sizeRows === "number" && next.sizeRows !== prev.sizeRows) {
    updates.sizeRows = next.sizeRows;
  }
  if (typeof next.rotation === "number" && next.rotation !== prev.rotation) {
    updates.rotation = next.rotation;
  }
  if (typeof next.opacity === "number" && next.opacity !== prev.opacity) {
    updates.opacity = next.opacity;
  }
  if (typeof next.flipX === "boolean" && next.flipX !== prev.flipX) {
    updates.flipX = next.flipX;
  }
  if (typeof next.flipY === "boolean" && next.flipY !== prev.flipY) {
    updates.flipY = next.flipY;
  }
  if (typeof next.linkXY === "boolean" && next.linkXY !== prev.linkXY) {
    updates.linkXY = next.linkXY;
  }

  return updates;
};

export const isMultiSelectionNeutral = (gridSettings) => {
  if (!gridSettings) return false;
  return (
    gridSettings.sizeCols === 0 &&
    gridSettings.sizeRows === 0 &&
    gridSettings.sizeTiles === 0 &&
    gridSettings.rotation === 0 &&
    gridSettings.opacity === 0 &&
    !gridSettings.flipX &&
    !gridSettings.flipY
  );
};

const quantizeSize = (value, snapToGrid) => {
  if (!Number.isFinite(value)) return null;
  const clamped = Math.max(1, value);
  if (snapToGrid) {
    return Math.round(clamped);
  }
  return Number.parseFloat(clamped.toFixed(2));
};

export const applyMultiSelectionUpdates = ({
  selectedObjIds,
  currentLayer,
  getObjectById,
  updateObjectById,
  gridSettings,
  prevGridSettings,
  snapToGrid = true,
}) => {
  const updates = getMultiSelectionUpdates(gridSettings, prevGridSettings);
  if (!updates || Object.keys(updates).length === 0) return;

  for (const id of selectedObjIds) {
    const current = getObjectById(currentLayer, id);
    if (!current) continue;

    const patch = {};
    if (typeof updates.sizeCols === "number") {
      patch.wTiles = quantizeSize(updates.sizeCols, snapToGrid);
    }
    if (typeof updates.sizeRows === "number") {
      patch.hTiles = quantizeSize(updates.sizeRows, snapToGrid);
    }
    if (typeof updates.rotation === "number") {
      patch.rotation = updates.rotation;
    }
    if (typeof updates.opacity === "number") {
      patch.opacity = Math.max(0.05, Math.min(1, updates.opacity));
    }
    if (typeof updates.flipX === "boolean") {
      patch.flipX = updates.flipX;
    }
    if (typeof updates.flipY === "boolean") {
      patch.flipY = updates.flipY;
    }
    if (typeof updates.linkXY === "boolean") {
      patch.linkXY = updates.linkXY;
    }

    const hasChanges = Object.entries(patch).some(([key, value]) => current[key] !== value);
    if (!hasChanges) continue;

    updateObjectById(currentLayer, current.id, patch);
  }
};

export const getObjectSizeFromGrid = ({ gridSettings, obj, aspect }) => {
  let nextW = obj.wTiles;
  let nextH = obj.hTiles;
  const sc = gridSettings.sizeCols;
  const sr = gridSettings.sizeRows;
  const st = gridSettings.sizeTiles;
  const snapToGrid = !!gridSettings.snapToGrid;

  if (typeof sc === "number" && sc >= 1) nextW = quantizeSize(sc, snapToGrid);
  if (typeof sr === "number" && sr >= 1) nextH = quantizeSize(sr, snapToGrid);

  if (
    (typeof sc !== "number" || sc < 1) &&
    (typeof sr !== "number" || sr < 1) &&
    typeof st === "number" &&
    st >= 1
  ) {
    nextW = quantizeSize(st, snapToGrid);
    nextH = quantizeSize(nextW / aspect, snapToGrid);
  }

  return { nextW, nextH };
};

export const getTokenSizeFromGrid = ({ gridSettings, token }) => {
  let wTiles = token.wTiles || 1;
  let hTiles = token.hTiles || 1;
  const sc = gridSettings.sizeCols;
  const sr = gridSettings.sizeRows;
  const st = gridSettings.sizeTiles;
  const snapToGrid = !!gridSettings.snapToGrid;

  if (typeof sc === "number" && sc >= 1) wTiles = quantizeSize(sc, snapToGrid);
  if (typeof sr === "number" && sr >= 1) hTiles = quantizeSize(sr, snapToGrid);

  if (
    (typeof sc !== "number" || sc < 1) &&
    (typeof sr !== "number" || sr < 1) &&
    typeof st === "number" &&
    st >= 1
  ) {
    wTiles = quantizeSize(st, snapToGrid);
    hTiles = quantizeSize(wTiles, snapToGrid);
  }

  return { wTiles, hTiles };
};

export const getCenteredPosition = ({ centerRow, centerCol, nextW, nextH, rows, cols, snapToGrid }) => {
  let newRow = centerRow - nextH / 2;
  let newCol = centerCol - nextW / 2;

  if (snapToGrid) {
    newRow = Math.round(newRow);
    newCol = Math.round(newCol);
  }

  return {
    newRow: clamp(newRow, 0, Math.max(0, rows - nextH)),
    newCol: clamp(newCol, 0, Math.max(0, cols - nextW)),
  };
};
