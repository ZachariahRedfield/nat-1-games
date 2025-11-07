import { useEffect, useRef, useState } from "react";
import { useAssetLibrary } from "../../modules/assets/useAssetLibrary.js";
import { useAssetExports } from "../../modules/assets/useAssetExports.js";

export function useLegacyAssetWorkflow({
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
  interactionMode,
  gridSettings,
  setGridSettings,
  hasSelection,
  showToast,
  promptUser,
  confirmUser,
  setUndoStack,
  setRedoStack,
  updateObjectById,
  currentLayer,
  tileSize,
  objects,
  selectedObj,
  selectedObjsList,
  selectedToken,
  selectedTokensList,
  setSelectedToken,
}) {
  const {
    assets,
    setAssets,
    getAsset,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    selectAsset,
    assetGroup,
    setAssetGroup,
    showAssetKindMenu,
    setShowAssetKindMenu,
    showAssetPreviews,
    setShowAssetPreviews,
    creatorOpen,
    setCreatorOpen,
    creatorKind,
    setCreatorKind,
    editingAsset,
    setEditingAsset,
    openCreator,
    openEditAsset,
    handleCreatorCreate,
    addColorMode,
    setAddColorMode,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    newLabelText,
    setNewLabelText,
    newLabelColor,
    setNewLabelColor,
    newLabelSize,
    setNewLabelSize,
    newLabelFont,
    setNewLabelFont,
    flowHue,
    setFlowHue,
    flowSat,
    setFlowSat,
    flowLight,
    setFlowLight,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
    updateAssetById,
    mapAssetToCreatorKind,
    handleUpload,
    handleCreateNatural,
    createTextLabelAsset,
    needsAssetsFolder,
    setNeedsAssetsFolder,
    promptChooseAssetsFolder,
    normalizeStamp,
    normalizeNaturalSettings,
  } = useAssetLibrary({
    setEngine,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
  });

  const [brushSize, setBrushSize] = useState(2);
  const [canvasOpacity, setCanvasOpacity] = useState(0.35);
  const [canvasSpacing, setCanvasSpacing] = useState(0.27);
  const [canvasBlendMode, setCanvasBlendMode] = useState("source-over");
  const [canvasSmoothing, setCanvasSmoothing] = useState(0.55);

  const loadingGridDefaultsRef = useRef(false);
  const loadingAssetStampDefaultsRef = useRef(false);
  const loadingNaturalDefaultsRef = useRef(false);

  useEffect(() => {
    if (!selectedAsset) return;
    const defaults = selectedAsset.stampDefaults || selectedAsset.defaults || {};
    loadingGridDefaultsRef.current = true;
    setGridSettings((prev) => ({
      ...prev,
      sizeTiles: Number.isFinite(defaults.sizeTiles) ? defaults.sizeTiles : prev.sizeTiles ?? 1,
      sizeCols: Number.isFinite(defaults.sizeCols)
        ? defaults.sizeCols
        : Number.isFinite(defaults.sizeTiles)
        ? defaults.sizeTiles
        : prev.sizeCols ?? 1,
      sizeRows: Number.isFinite(defaults.sizeRows)
        ? defaults.sizeRows
        : Number.isFinite(defaults.sizeTiles)
        ? defaults.sizeTiles
        : prev.sizeRows ?? 1,
      rotation: Number.isFinite(defaults.rotation) ? defaults.rotation : prev.rotation ?? 0,
      flipX: defaults.flipX ?? prev.flipX ?? false,
      flipY: defaults.flipY ?? prev.flipY ?? false,
      opacity: Number.isFinite(defaults.opacity) ? defaults.opacity : prev.opacity ?? 1,
      snapToGrid: defaults.snapToGrid ?? prev.snapToGrid ?? true,
      snapStep: Number.isFinite(defaults.snapStep) ? defaults.snapStep : prev.snapStep ?? 1,
      linkXY: defaults.linkXY ?? prev.linkXY ?? false,
    }));
    setTimeout(() => {
      loadingGridDefaultsRef.current = false;
    }, 0);
  }, [selectedAsset, setGridSettings]);

  useEffect(() => {
    const defaults = selectedAsset?.stampDefaults || selectedAsset?.defaults || {};
    loadingAssetStampDefaultsRef.current = true;
    setAssetStamp(normalizeStamp(defaults));
    setTimeout(() => {
      loadingAssetStampDefaultsRef.current = false;
    }, 0);
  }, [normalizeStamp, selectedAsset, setAssetStamp]);

  useEffect(() => {
    const asset = getAsset(selectedAssetId);
    if (!asset || asset.kind !== "natural") return;
    const defaults = asset.naturalDefaults || {};
    loadingNaturalDefaultsRef.current = true;
    setNaturalSettings((current) => ({
      ...current,
      ...normalizeNaturalSettings(defaults),
    }));
    setTimeout(() => {
      loadingNaturalDefaultsRef.current = false;
    }, 0);
  }, [getAsset, normalizeNaturalSettings, selectedAssetId, setNaturalSettings]);

  useEffect(() => {
    if (!selectedAssetId || !assetStamp) return;
    if (loadingAssetStampDefaultsRef.current) return;
    const currentAsset = getAsset(selectedAssetId);
    const previousDefaults = currentAsset?.stampDefaults || {};
    const normalizedStamp = normalizeStamp(assetStamp);
    const same =
      previousDefaults &&
      previousDefaults.sizeTiles === normalizedStamp.sizeTiles &&
      previousDefaults.sizeCols === normalizedStamp.sizeCols &&
      previousDefaults.sizeRows === normalizedStamp.sizeRows &&
      previousDefaults.rotation === normalizedStamp.rotation &&
      !!previousDefaults.flipX === normalizedStamp.flipX &&
      !!previousDefaults.flipY === normalizedStamp.flipY &&
      Math.abs((previousDefaults.opacity ?? 1) - (normalizedStamp.opacity ?? 1)) < 0.0001 &&
      !!previousDefaults.snapToGrid === normalizedStamp.snapToGrid &&
      (previousDefaults.snapStep ?? 1) === normalizedStamp.snapStep &&
      !!previousDefaults.linkXY === normalizedStamp.linkXY;
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
    }
  }, [assetStamp, getAsset, normalizeStamp, selectedAssetId, updateAssetById]);

  useEffect(() => {
    if (!selectedAssetId) return;
    if (hasSelection) return;
    if (loadingGridDefaultsRef.current) return;
    const currentAsset = getAsset(selectedAssetId);
    if (!currentAsset) return;
    const normalizedStamp = normalizeStamp(gridSettings || {});
    const previousDefaults = currentAsset.stampDefaults || {};
    const same =
      previousDefaults &&
      previousDefaults.sizeTiles === normalizedStamp.sizeTiles &&
      previousDefaults.sizeCols === normalizedStamp.sizeCols &&
      previousDefaults.sizeRows === normalizedStamp.sizeRows &&
      previousDefaults.rotation === normalizedStamp.rotation &&
      !!previousDefaults.flipX === normalizedStamp.flipX &&
      !!previousDefaults.flipY === normalizedStamp.flipY &&
      Math.abs((previousDefaults.opacity ?? 1) - (normalizedStamp.opacity ?? 1)) < 0.0001 &&
      !!previousDefaults.snapToGrid === normalizedStamp.snapToGrid &&
      (previousDefaults.snapStep ?? 1) === normalizedStamp.snapStep &&
      !!previousDefaults.linkXY === normalizedStamp.linkXY;
    if (!same) {
      updateAssetById(selectedAssetId, { stampDefaults: normalizedStamp });
      setAssetStamp(normalizedStamp);
    }
  }, [getAsset, gridSettings, hasSelection, normalizeStamp, selectedAssetId, setAssetStamp, updateAssetById]);

  useEffect(() => {
    if (!selectedAssetId) return;
    if (hasSelection) return;
    if (loadingNaturalDefaultsRef.current) return;
    const currentAsset = getAsset(selectedAssetId);
    if (!currentAsset || currentAsset.kind !== "natural") return;
    const normalized = normalizeNaturalSettings(naturalSettings);
    const previousDefaults = currentAsset.naturalDefaults || {};
    const same =
      !!previousDefaults &&
      !!previousDefaults.randomRotation === normalized.randomRotation &&
      !!previousDefaults.randomFlipX === normalized.randomFlipX &&
      !!previousDefaults.randomFlipY === normalized.randomFlipY &&
      !!(previousDefaults.randomSize?.enabled) === normalized.randomSize.enabled &&
      (previousDefaults.randomSize?.min ?? 1) === normalized.randomSize.min &&
      (previousDefaults.randomSize?.max ?? 1) === normalized.randomSize.max &&
      !!(previousDefaults.randomOpacity?.enabled) === normalized.randomOpacity.enabled &&
      (previousDefaults.randomOpacity?.min ?? 1) === normalized.randomOpacity.min &&
      (previousDefaults.randomOpacity?.max ?? 1) === normalized.randomOpacity.max &&
      (previousDefaults.randomVariant ?? true) === normalized.randomVariant;
    if (!same) {
      updateAssetById(selectedAssetId, { naturalDefaults: normalized });
    }
  }, [getAsset, hasSelection, naturalSettings, normalizeNaturalSettings, selectedAssetId, updateAssetById]);

  useEffect(() => {
    if (assetGroup !== "token" && interactionMode !== "select" && selectedToken && setSelectedToken) {
      setSelectedToken(null);
    }
  }, [assetGroup, interactionMode, selectedToken, setSelectedToken]);

  const assetExports = useAssetExports({
    assets,
    setAssets,
    setSelectedAssetId,
    setAssetGroup,
    setEngine,
    selectedObj,
    selectedObjsList,
    selectedToken,
    selectedTokensList,
    updateObjectById,
    currentLayer,
    tileSize,
    promptUser,
    confirmUser,
    showToast,
    setUndoStack,
    setRedoStack,
    objects,
  });

  return {
    assets,
    setAssets,
    getAsset,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    selectAsset,
    assetGroup,
    setAssetGroup,
    showAssetKindMenu,
    setShowAssetKindMenu,
    showAssetPreviews,
    setShowAssetPreviews,
    creatorOpen,
    setCreatorOpen,
    creatorKind,
    setCreatorKind,
    editingAsset,
    setEditingAsset,
    openCreator,
    openEditAsset,
    handleCreatorCreate,
    addColorMode,
    setAddColorMode,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    newLabelText,
    setNewLabelText,
    newLabelColor,
    setNewLabelColor,
    newLabelSize,
    setNewLabelSize,
    newLabelFont,
    setNewLabelFont,
    flowHue,
    setFlowHue,
    flowSat,
    setFlowSat,
    flowLight,
    setFlowLight,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
    updateAssetById,
    mapAssetToCreatorKind,
    handleUpload,
    handleCreateNatural,
    createTextLabelAsset,
    needsAssetsFolder,
    setNeedsAssetsFolder,
    promptChooseAssetsFolder,
    normalizeStamp,
    normalizeNaturalSettings,
    brushSize,
    setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    ...assetExports,
  };
}
