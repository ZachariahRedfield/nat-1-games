import { useCallback } from "react";
import { useTokenState } from "../../modules/tokens/index.js";

export function useTokenSelectionState({ setGridSettings, snapToGrid = true }) {
  const tokenState = useTokenState();
  const {
    setSelectedToken,
    setSelectedTokensList,
  } = tokenState;

  const quantizeSize = useCallback((value) => {
    const clamped = Math.max(1, value);
    if (snapToGrid) {
      return Math.round(clamped);
    }
    return Number.parseFloat(clamped.toFixed(2));
  }, [snapToGrid]);

  const handleTokenSelectionChange = useCallback(
    (tokOrArr) => {
      const arr = Array.isArray(tokOrArr) ? tokOrArr : tokOrArr ? [tokOrArr] : [];
      if (arr.length) {
        setSelectedTokensList(arr);
        const tok = arr[arr.length - 1];
        setSelectedToken(tok);
        setGridSettings((prev) => ({
          ...prev,
          sizeTiles: quantizeSize(tok.wTiles || 1),
          sizeCols: quantizeSize(tok.wTiles || 1),
          sizeRows: quantizeSize(tok.hTiles || 1),
          rotation: tok.rotation || 0,
          flipX: false,
          flipY: false,
          opacity: tok.opacity ?? 1,
        }));
      } else {
        setSelectedToken(null);
        setSelectedTokensList([]);
      }
    },
    [quantizeSize, setGridSettings, setSelectedToken, setSelectedTokensList],
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
