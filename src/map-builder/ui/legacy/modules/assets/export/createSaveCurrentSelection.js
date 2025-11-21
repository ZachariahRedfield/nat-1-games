export function createSaveCurrentSelection({
  confirmUser,
  saveMultipleObjectsAsMergedImage,
  saveMultipleObjectsAsNaturalGroup,
  saveSelectedTokenAsAsset,
  saveSelectedTokensAsGroup,
  saveSelectionAsAsset,
  selectedObjsList,
  selectedTokensList,
  showToast,
}) {
  return async () => {
    const tokenCount = selectedTokensList?.length || 0;
    const objectCount = selectedObjsList?.length || 0;
    if (tokenCount > 0 && objectCount > 0) {
      showToast?.("Mixed selection not supported. Select only images or only tokens.", "warning", 3500);
      return;
    }
    if (tokenCount > 1) {
      await saveSelectedTokensAsGroup(selectedTokensList);
      return;
    }
    if (objectCount > 1) {
      const choice = await confirmUser?.(
        "Save as Natural group?\nOK: Natural Group (each selection becomes a variant)\nCancel: Merge into single Image"
      );
      if (choice) {
        await saveMultipleObjectsAsNaturalGroup(selectedObjsList);
      } else {
        await saveMultipleObjectsAsMergedImage(selectedObjsList);
      }
      return;
    }
    if (tokenCount === 1) {
      await saveSelectedTokenAsAsset();
      return;
    }
    if (objectCount === 1) {
      await saveSelectionAsAsset();
    }
  };
}
