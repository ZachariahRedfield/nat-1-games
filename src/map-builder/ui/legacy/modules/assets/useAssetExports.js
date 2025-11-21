import {
  useLabelAssetRegenerator,
  useMergedImageSaver,
  useNaturalGroupSaver,
  useSelectionAssetSaver,
  useSelectionExport,
  useTokenGroupSaver,
  useTokenVariantSaver,
} from "./exports/index.js";

export function useAssetExports(deps) {
  const {
    confirmUser,
    showToast,
    selectedTokensList,
    selectedObjsList,
  } = deps;

  const regenerateLabelInstance = useLabelAssetRegenerator(deps);
  const saveSelectionAsAsset = useSelectionAssetSaver(deps);
  const saveSelectedTokenAsAsset = useTokenVariantSaver(deps);
  const saveMultipleObjectsAsNaturalGroup = useNaturalGroupSaver(deps);
  const saveMultipleObjectsAsMergedImage = useMergedImageSaver(deps);
  const saveSelectedTokensAsGroup = useTokenGroupSaver(deps);

  const saveCurrentSelection = useSelectionExport({
    confirmUser,
    showToast,
    saveSelectedTokensAsGroup,
    saveSelectedTokenAsAsset,
    saveSelectionAsAsset,
    saveMultipleObjectsAsMergedImage,
    saveMultipleObjectsAsNaturalGroup,
    selectedTokensList,
    selectedObjsList,
  });

  return {
    regenerateLabelInstance,
    saveSelectionAsAsset,
    saveSelectedTokenAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokensAsGroup,
    saveCurrentSelection,
  };
}
