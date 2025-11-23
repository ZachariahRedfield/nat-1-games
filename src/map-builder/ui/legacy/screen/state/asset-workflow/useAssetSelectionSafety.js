import { useEffect } from "react";

export function useAssetSelectionSafety({
  assetGroup,
  interactionMode,
  selectedToken,
  setSelectedToken,
}) {
  useEffect(() => {
    if (assetGroup !== "token" && interactionMode !== "select" && selectedToken && setSelectedToken) {
      setSelectedToken(null);
    }
  }, [assetGroup, interactionMode, selectedToken, setSelectedToken]);
}

export default useAssetSelectionSafety;
