import { useCallback } from "react";
import { useTokenState } from "../../modules/tokens/index.js";

export function useTokenSelectionState({ setGridSettings }) {
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
        setSelectedToken(tok);
        setGridSettings((prev) => ({
          ...prev,
          sizeTiles: Math.max(1, Math.round(tok.wTiles || 1)),
          sizeCols: Math.max(1, Math.round(tok.wTiles || 1)),
          sizeRows: Math.max(1, Math.round(tok.hTiles || 1)),
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
    [setGridSettings, setSelectedToken, setSelectedTokensList],
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
