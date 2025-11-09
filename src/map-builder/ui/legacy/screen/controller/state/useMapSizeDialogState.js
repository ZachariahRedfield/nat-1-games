import { useCallback, useState } from "react";

export function useMapSizeDialogState() {
  const [mapSizeModalOpen, setMapSizeModalOpen] = useState(false);
  const openMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(true);
  }, []);
  const closeMapSizeModal = useCallback(() => {
    setMapSizeModalOpen(false);
  }, []);

  return {
    mapSizeModalOpen,
    openMapSizeModal,
    closeMapSizeModal,
    setMapSizeModalOpen,
  };
}

export default useMapSizeDialogState;
