import { useEffect } from "react";

export function useSelectionHotkeys({
  selectedObjId,
  selectedTokenId,
  selectedObjIds,
  selectedTokenIds,
  currentLayer,
  dragRef,
  onBeginObjectStroke,
  onBeginTokenStroke,
  removeObjectById,
  removeTokenById,
  clearObjectSelection,
  clearTokenSelection,
}) {
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (
        target &&
        (target.isContentEditable === true ||
          (target.tagName &&
            (target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA" ||
              target.tagName === "SELECT")))
      ) {
        return;
      }

      if (selectedTokenIds.length || selectedTokenId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          onBeginTokenStroke?.();
          const ids =
            selectedTokenIds.length > 0
              ? selectedTokenIds
              : selectedTokenId
              ? [selectedTokenId]
              : [];
          ids.forEach((id) => removeTokenById?.(id));
          clearTokenSelection();
        } else if (e.key === "Escape") {
          clearTokenSelection();
          if (dragRef) dragRef.current = null;
        }
        return;
      }

      if (!(selectedObjIds.length || selectedObjId)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        onBeginObjectStroke?.(currentLayer);
        const ids =
          selectedObjIds.length > 0
            ? selectedObjIds
            : selectedObjId
            ? [selectedObjId]
            : [];
        ids.forEach((id) => removeObjectById(currentLayer, id));
        clearObjectSelection();
      } else if (e.key === "Escape") {
        clearObjectSelection();
        if (dragRef) dragRef.current = null;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedObjId,
    selectedTokenId,
    selectedObjIds,
    selectedTokenIds,
    currentLayer,
    onBeginObjectStroke,
    onBeginTokenStroke,
    removeObjectById,
    removeTokenById,
    clearObjectSelection,
    clearTokenSelection,
    dragRef,
  ]);
}

export default useSelectionHotkeys;
