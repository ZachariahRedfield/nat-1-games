export function deleteSelection({
  onBeginTokenStroke,
  onBeginObjectStroke,
  currentLayer,
  selectedTokensList,
  selectedObjsList,
  removeObjectById,
  removeTokenById,
  clearObjectSelection,
  clearTokenSelection,
  showToast,
}) {
  const hasTokens = (selectedTokensList?.length || 0) > 0;
  const hasObjects = (selectedObjsList?.length || 0) > 0;

  if (!hasTokens && !hasObjects) {
    return;
  }

  if (hasTokens) {
    onBeginTokenStroke?.();
    for (const token of selectedTokensList) {
      removeTokenById?.(token.id);
    }
    clearTokenSelection?.();
    showToast?.("Deleted selected token(s).", "success");
    return;
  }

  if (hasObjects) {
    onBeginObjectStroke?.(currentLayer);
    for (const obj of selectedObjsList) {
      removeObjectById?.(currentLayer, obj.id);
    }
    clearObjectSelection?.();
    showToast?.("Deleted selected object(s).", "success");
  }
}
