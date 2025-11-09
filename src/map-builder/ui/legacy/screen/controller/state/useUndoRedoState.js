import { useState } from "react";

export function useUndoRedoState() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  return { undoStack, setUndoStack, redoStack, setRedoStack };
}

export default useUndoRedoState;
