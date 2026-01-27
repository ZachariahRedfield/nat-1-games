import { useCallback } from "react";
import { useTokenState } from "../../modules/tokens/index.js";

export function useTokenSelectionState({ setGridSettings, snapToGrid = true }) {
  const tokenState = useTokenState();
  const {
    setSelectedToken,
    setSelectedTokensList,
  } = tokenState;

  const handleTokenSelectionChange = useCallback(
    (tokOrArr) => {
      const arr = Array.isArray(tokOrArr) ? tokOrArr : tokOrArr ? [tokOrArr] : [];
      if (arr.length) {
        setSelectedTokensList(arr);
        const tok = arr[arr.length - 1];
        const tokenSnap = typeof tok.snapToGrid === "boolean" ? tok.snapToGrid : snapToGrid;
        const quantizeValue = (value) => {
          const clamped = Math.max(1, value);
          if (tokenSnap) {
            return Math.round(clamped);
          }
          return Number.parseFloat(clamped.toFixed(2));
        };
        setSelectedToken(tok);
        setGridSettings((prev) => ({
          ...prev,
          sizeTiles: quantizeValue(tok.wTiles || 1),
          sizeCols: quantizeValue(tok.wTiles || 1),
          sizeRows: quantizeValue(tok.hTiles || 1),
          rotation: tok.rotation || 0,
          flipX: false,
          flipY: false,
          opacity: tok.opacity ?? 1,
          snapToGrid: tokenSnap,
        }));
      } else {
        setSelectedToken(null);
        setSelectedTokensList([]);
      }
    },
    [setGridSettings, setSelectedToken, setSelectedTokensList, snapToGrid],
  );

  const clearTokenSelection = useCallback(() => {
    setSelectedToken(null);
    setSelectedTokensList([]);
  }, [setSelectedToken, setSelectedTokensList]);

  return {
    ...tokenState,
    handleTokenSelectionChange,
    clearTokenSelection,
  };
}
