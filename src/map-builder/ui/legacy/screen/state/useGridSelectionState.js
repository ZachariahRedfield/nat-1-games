import { useCallback, useRef, useState } from "react";

export function useGridSelectionState({ gridSettings, setGridSettings }) {
  const gridDefaultsRef = useRef(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedObjsList, setSelectedObjsList] = useState([]);

  const handleSelectionChange = useCallback(
    (objOrArr) => {
      const arr = Array.isArray(objOrArr) ? objOrArr : objOrArr ? [objOrArr] : [];
      if (arr.length) {
        if (!hasSelection) {
          gridDefaultsRef.current = { ...gridSettings };
        }
        setHasSelection(true);
        setSelectedObjsList(arr);
        const obj = arr[arr.length - 1];
        setSelectedObj(obj);

        setGridSettings((prev) => ({
          ...prev,
          sizeTiles: Math.max(1, Math.round(obj.wTiles || 1)),
          sizeCols: Math.max(1, Math.round(obj.wTiles || 1)),
          sizeRows: Math.max(1, Math.round(obj.hTiles || 1)),
          rotation: obj.rotation || 0,
          flipX: !!obj.flipX,
          flipY: !!obj.flipY,
          opacity: obj.opacity ?? 1,
        }));
        return;
      }

      const defaults = gridDefaultsRef.current;
      if (defaults) {
        setGridSettings((prev) => ({ ...prev, ...defaults }));
      }
      setHasSelection(false);
      setSelectedObj(null);
      setSelectedObjsList([]);
    },
    [gridSettings, hasSelection, setGridSettings],
  );

  const clearObjectSelection = useCallback(() => {
    const defaults = gridDefaultsRef.current;
    if (defaults) {
      setGridSettings((prev) => ({ ...prev, ...defaults }));
    }
    setHasSelection(false);
    setSelectedObj(null);
    setSelectedObjsList([]);
  }, [setGridSettings]);

  return {
    hasSelection,
    selectedObj,
    selectedObjsList,
    handleSelectionChange,
    clearObjectSelection,
  };
}
