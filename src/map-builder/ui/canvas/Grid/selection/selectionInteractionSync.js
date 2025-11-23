import { useEffect } from "react";

export function useSelectionInteractionSync({ interactionMode, clearSelections }) {
  useEffect(() => {
    if (interactionMode === "select") return;
    clearSelections();
  }, [interactionMode, clearSelections]);
}

export default useSelectionInteractionSync;
