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

function handleTokenSelection({ token, row, col, rowRaw, colRaw, selection, actions, dragRef }) {
  const { setSelectedObjId, setSelectedObjIds, setSelectedTokenIds, setSelectedTokenId } = selection;
  const { onTokenSelectionChange } = actions;
  const pointerRow = Number.isFinite(rowRaw) ? rowRaw : row;
  const pointerCol = Number.isFinite(colRaw) ? colRaw : col;

  setSelectedObjId(null);
  setSelectedObjIds([]);
  setSelectedTokenIds([token.id]);
  setSelectedTokenId(token.id);
  onTokenSelectionChange?.([token]);

  dragRef.current = {
    kind: "token",
    id: token.id,
    startRow: pointerRow,
    startCol: pointerCol,
    baseRow: token.row,
    baseCol: token.col,
    height: token.hTiles || 1,
    width: token.wTiles || 1,
    lastRow: token.row,
    lastCol: token.col,
  };
  return true;
}

function handleObjectSelection({
  event,
  object,
  row,
  col,
  rowRaw,
  colRaw,
  selection,
  actions,
  dragRef,
  callbacks,
  config,
}) {
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
  const pointerRow = Number.isFinite(rowRaw) ? rowRaw : row;
  const pointerCol = Number.isFinite(colRaw) ? colRaw : col;

  const additive = event?.metaKey || event?.ctrlKey;

  if (additive) {
    setSelectedTokenId(null);
    setSelectedTokenIds([]);

    const currentIds = Array.isArray(selectedObjIds) ? selectedObjIds : [];
    const alreadySelected = currentIds.includes(object.id);
    const nextIds = alreadySelected
      ? currentIds.filter((id) => id !== object.id)
      : [...currentIds, object.id];

    if (!nextIds.length) {
      setSelectedObjIds([]);
      setSelectedObjId(null);
      onSelectionChange?.([]);
      dragRef.current = null;
      return true;
    }

    const selectionOffsets = nextIds
      .map((id) => {
        const current = getObjectById(currentLayer, id);
        if (!current) return null;
        return {
          id,
          offsetRow: pointerRow - current.row,
          offsetCol: pointerCol - current.col,
          height: current.hTiles,
          width: current.wTiles,
          row: current.row,
          col: current.col,
        };
      })
      .filter(Boolean);

    setSelectedObjIds(nextIds);
    setSelectedObjId(object.id);
    onSelectionChange?.(
      nextIds.map((id) => getObjectById(currentLayer, id)).filter(Boolean),
    );

    if (selectionOffsets.length > 1) {
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
        startRow: pointerRow,
        startCol: pointerCol,
        lastRowShift: 0,
        lastColShift: 0,
      };
      return true;
    }

    onBeginObjectStroke?.(currentLayer);
    dragRef.current = {
      kind: "object",
      id: object.id,
      startRow: pointerRow,
      startCol: pointerCol,
      baseRow: object.row,
      baseCol: object.col,
      height: object.hTiles,
      width: object.wTiles,
      lastRow: object.row,
      lastCol: object.col,
    };
    return true;
  }

  if (selectedObjIds.length > 1 && selectedObjIds.includes(object.id)) {
    const selectionOffsets = selectedObjIds
      .map((id) => {
        const current = getObjectById(currentLayer, id);
        if (!current) return null;
        return {
          id,
          offsetRow: pointerRow - current.row,
          offsetCol: pointerCol - current.col,
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
      startRow: pointerRow,
      startCol: pointerCol,
      lastRowShift: 0,
      lastColShift: 0,
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
    startRow: pointerRow,
    startCol: pointerCol,
    baseRow: object.row,
    baseCol: object.col,
    height: object.hTiles,
    width: object.wTiles,
    lastRow: object.row,
    lastCol: object.col,
  };
  return true;
}

export const selectionHandlers = {
  clearSelection,
  handleTokenSelection,
  handleObjectSelection,
};
