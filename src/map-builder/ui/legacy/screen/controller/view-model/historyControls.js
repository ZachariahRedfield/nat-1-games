export function createHistoryControls(state) {
  return {
    undo: state.undo,
    redo: state.redo,
    undoStack: state.undoStack,
    redoStack: state.redoStack,
  };
}
