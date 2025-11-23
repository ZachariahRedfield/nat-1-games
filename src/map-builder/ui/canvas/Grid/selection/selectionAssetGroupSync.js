import { useEffect } from "react";

export function useSelectionAssetGroupSync({
  assetGroup,
  selectedObjId,
  selectedObjIds,
  selectedTokenId,
  selectedTokenIds,
  clearObjectSelection,
  clearTokenSelection,
}) {
  useEffect(() => {
    if (assetGroup === "token") {
      if (selectedObjId || selectedObjIds.length) {
        clearObjectSelection();
      }
    } else if (selectedTokenId || selectedTokenIds.length) {
      clearTokenSelection();
    }
  }, [
    assetGroup,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    clearObjectSelection,
    clearTokenSelection,
  ]);
}

export default useSelectionAssetGroupSync;
