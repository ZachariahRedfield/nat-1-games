import { useCallback, useState } from "react";

export function useSaveSelectionDialogState() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const openSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);
  const closeSaveSelectionDialog = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  return {
    saveDialogOpen,
    openSaveSelectionDialog,
    closeSaveSelectionDialog,
  };
}

export default useSaveSelectionDialogState;
