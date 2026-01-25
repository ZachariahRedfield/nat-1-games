import { useEffect } from "react";

export function useSelectionInteractionSync({ interactionMode, clearSelections, allowInactiveSelection = false }) {
  useEffect(() => {
    if (interactionMode === "select" || allowInactiveSelection) return;
    clearSelections();
  }, [interactionMode, clearSelections, allowInactiveSelection]);
}

export default useSelectionInteractionSync;
