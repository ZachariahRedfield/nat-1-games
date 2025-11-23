function clearSelection({ selection, actions }) {
  const { setSelectedObjId, setSelectedObjIds, setSelectedTokenId, setSelectedTokenIds } = selection;
  const { onSelectionChange, onTokenSelectionChange } = actions;

  setSelectedObjId(null);
  setSelectedObjIds([]);
  onSelectionChange?.([]);
  setSelectedTokenId(null);
  setSelectedTokenIds([]);
  onTokenSelectionChange?.([]);
}

function handleTokenSelection({ token, row, col, selection, actions, dragRef }) {
  const { setSelectedObjId, setSelectedObjIds, setSelectedTokenIds, setSelectedTokenId } = selection;
  const { onTokenSelectionChange } = actions;

  setSelectedObjId(null);
  setSelectedObjIds([]);
  setSelectedTokenIds([token.id]);
  setSelectedTokenId(token.id);
  onTokenSelectionChange?.([token]);

  dragRef.current = {
    kind: "token",
    id: token.id,
    offsetRow: row - token.row,
    offsetCol: col - token.col,
  };
  return true;
}

function handleObjectSelection({ object, row, col, selection, actions, dragRef, callbacks, config }) {
  const {
    setSelectedTokenId,
    setSelectedTokenIds,
    setSelectedObjIds,
    setSelectedObjId,
    selectedObjIds = [],
    getObjectById,
  } = selection;
  const { onSelectionChange } = actions;
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;

  if (selectedObjIds.length > 1 && selectedObjIds.includes(object.id)) {
    const selectionOffsets = selectedObjIds
      .map((id) => {
        const current = getObjectById(currentLayer, id);
        if (!current) return null;
        return {
          id,
          offsetRow: row - current.row,
          offsetCol: col - current.col,
          height: current.hTiles,
          width: current.wTiles,
          row: current.row,
          col: current.col,
        };
      })
      .filter(Boolean);

    if (!selectionOffsets.length) return true;

    const minRow = Math.min(...selectionOffsets.map((item) => item.row));
    const maxRow = Math.max(...selectionOffsets.map((item) => item.row + item.height));
    const minCol = Math.min(...selectionOffsets.map((item) => item.col));
    const maxCol = Math.max(...selectionOffsets.map((item) => item.col + item.width));

    onBeginObjectStroke?.(currentLayer);
    dragRef.current = {
      kind: "multi-object",
      ids: selectionOffsets.map((item) => item.id),
      offsets: selectionOffsets.map(({ id, offsetRow, offsetCol, height, width }) => ({
        id,
        offsetRow,
        offsetCol,
        height,
        width,
      })),
      bounds: { minRow, maxRow, minCol, maxCol },
      startRow: row,
      startCol: col,
    };
    return true;
  }

  onBeginObjectStroke?.(currentLayer);
  setSelectedTokenId(null);
  setSelectedTokenIds([]);
  setSelectedObjIds([object.id]);
  setSelectedObjId(object.id);
  onSelectionChange?.([object]);

  dragRef.current = {
    kind: "object",
    id: object.id,
    offsetRow: row - object.row,
    offsetCol: col - object.col,
  };
  return true;
}

export const selectionHandlers = {
  clearSelection,
  handleTokenSelection,
  handleObjectSelection,
};
