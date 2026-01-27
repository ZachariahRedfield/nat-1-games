import { useCallback, useRef, useState } from "react";

export function useGridSelectionState({ gridSettings, setGridSettings }) {
  const gridDefaultsRef = useRef(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedObjsList, setSelectedObjsList] = useState([]);
  const snapToGrid = gridSettings?.snapToGrid ?? true;

  const quantizeSize = useCallback((value) => {
    const clamped = Math.max(1, value);
    if (snapToGrid) {
      return Math.round(clamped);
    }
    return Number.parseFloat(clamped.toFixed(2));
  }, [snapToGrid]);

  const getUniformValue = useCallback((items, getValue) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    const first = getValue(items[0]);
    const matches = items.every((item) => getValue(item) === first);
    return matches ? first : null;
  }, []);

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

        if (arr.length > 1) {
          const sizeCols = getUniformValue(arr, (item) => quantizeSize(item.wTiles || 1));
          const sizeRows = getUniformValue(arr, (item) => quantizeSize(item.hTiles || 1));
          const rotation = getUniformValue(arr, (item) => item.rotation || 0);
          const flipX = getUniformValue(arr, (item) => !!item.flipX);
          const flipY = getUniformValue(arr, (item) => !!item.flipY);
          const opacity = getUniformValue(arr, (item) => item.opacity ?? 1);
          const linkXY = getUniformValue(arr, (item) => !!item.linkXY);
          const sizeTiles = sizeCols !== null && sizeRows !== null && sizeCols === sizeRows ? sizeCols : null;
          setGridSettings((prev) => ({
            ...prev,
            sizeTiles,
            sizeCols,
            sizeRows,
            rotation,
            flipX,
            flipY,
            opacity,
            linkXY,
          }));
        } else {
          setGridSettings((prev) => ({
            ...prev,
            sizeTiles: quantizeSize(obj.wTiles || 1),
            sizeCols: quantizeSize(obj.wTiles || 1),
            sizeRows: quantizeSize(obj.hTiles || 1),
            rotation: obj.rotation || 0,
            flipX: !!obj.flipX,
            flipY: !!obj.flipY,
            opacity: obj.opacity ?? 1,
            linkXY: !!obj.linkXY,
          }));
        }
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
    [getUniformValue, hasSelection, quantizeSize, setGridSettings],
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
