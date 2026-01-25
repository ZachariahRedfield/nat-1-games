import { clamp } from "../utils.js";

export const getSelectionIdsChange = (prevSelectedIds, currentSelectedIds) => {
  const prevIds = Array.isArray(prevSelectedIds) ? prevSelectedIds : [];
  const currentIds = Array.isArray(currentSelectedIds) ? currentSelectedIds : [];
  const changed =
    prevIds.length !== currentIds.length || prevIds.some((id, index) => id !== currentIds[index]);

  return { changed, prevIds, currentIds };
};

export const getMultiSelectionBaseline = (gridSettings, selectedIds) => {
  if (!Array.isArray(selectedIds) || selectedIds.length <= 1) return gridSettings;
  return {
    ...gridSettings,
    sizeCols: 0,
    sizeRows: 0,
    sizeTiles: 0,
    rotation: 0,
    opacity: 0,
    flipX: false,
    flipY: false,
  };
};

export const getMultiSelectionDeltas = (gridSettings, prevGridSettings) => {
  const prev = prevGridSettings || {};
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
    rawDeltaSizeCols || rawDeltaSizeRows || deltaRotation || deltaOpacity || flipXChanged || flipYChanged;

  return {
    hasDelta,
    rawDeltaSizeCols,
    rawDeltaSizeRows,
    deltaRotation,
    deltaOpacity,
    flipXChanged,
    flipYChanged,
  };
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

export const applyMultiSelectionUpdates = ({
  selectedObjIds,
  currentLayer,
  getObjectById,
  updateObjectById,
  gridSettings,
  deltas,
}) => {
  if (!deltas?.hasDelta) return;
  const uiLinked = !!gridSettings?.linkXY;

  for (const id of selectedObjIds) {
    const current = getObjectById(currentLayer, id);
    if (!current) continue;

    const linkXY = !!current.linkXY;
    const primaryDelta = linkXY ? deltas.rawDeltaSizeCols || deltas.rawDeltaSizeRows : null;

    const widthDelta = linkXY ? primaryDelta ?? 0 : deltas.rawDeltaSizeCols;
    let heightDelta;
    if (linkXY) {
      heightDelta = primaryDelta ?? 0;
    } else if (uiLinked && !linkXY && deltas.rawDeltaSizeCols && deltas.rawDeltaSizeCols === deltas.rawDeltaSizeRows) {
      // The settings UI mirrors values when its link toggle is on; respect per-object link flags by
      // ignoring mirrored height deltas for unlinked assets.
      heightDelta = 0;
    } else {
      heightDelta = deltas.rawDeltaSizeRows;
    }

    const wTiles = Math.max(1, Math.round((current.wTiles || 1) + widthDelta));
    const hTiles = Math.max(1, Math.round((current.hTiles || 1) + heightDelta));
    const rotation = ((current.rotation || 0) + deltas.deltaRotation + 360) % 360;
    const opacity = Math.max(0.05, Math.min(1, (current.opacity ?? 1) + deltas.deltaOpacity));

    updateObjectById(currentLayer, current.id, {
      wTiles,
      hTiles,
      rotation,
      flipX: deltas.flipXChanged ? !!gridSettings.flipX : current.flipX,
      flipY: deltas.flipYChanged ? !!gridSettings.flipY : current.flipY,
      opacity,
      linkXY: current.linkXY,
    });
  }
};

export const getObjectSizeFromGrid = ({ gridSettings, obj, aspect }) => {
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

  return { nextW, nextH };
};

export const getTokenSizeFromGrid = ({ gridSettings, token }) => {
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
