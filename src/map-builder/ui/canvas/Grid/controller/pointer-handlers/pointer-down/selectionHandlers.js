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
  const { setSelectedTokenId, setSelectedTokenIds, setSelectedObjIds, setSelectedObjId } = selection;
  const { onSelectionChange } = actions;
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;

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
