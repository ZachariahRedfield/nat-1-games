import { useCallback } from "react";
import { LAYERS } from "../../utils.js";

function cloneAssetList(assets) {
  return assets.map((asset) => ({ ...asset }));
}

export function useLegacyProjectSaving({
  isAssetsFolderConfigured,
  showToast,
  setNeedsAssetsFolder,
  hasCurrentProjectDir,
  promptUser,
  saveProjectManager,
  saveProjectAsManager,
  loadAssetsFromStoredParent,
  setAssets,
  setSelectedAssetId,
  setUndoStack,
  setRedoStack,
  projectNameRef,
  canvasRefs,
  rows,
  cols,
  tileSize,
  maps,
  objects,
  tokens,
  assets,
  currentLayer,
  brushSize,
  gridSettings,
  engine,
  layerVisibility,
  tokensVisible,
  tokenHUDVisible,
  tokenHUDShowInitiative,
  assetGroup,
  showGridLines,
  canvasOpacity,
  canvasSpacing,
  canvasBlendMode,
  canvasSmoothing,
  naturalSettings,
}) {
  const pruneUnreferencedAssets = useCallback(() => {
    try {
      const referenced = new Set();
      for (const layer of LAYERS) {
        for (const object of objects[layer] || []) {
          referenced.add(object.assetId);
        }
      }
      for (const token of tokens || []) {
        referenced.add(token.assetId);
      }
      const nextAssets = assets.filter(
        (asset) => !asset.hiddenFromUI || referenced.has(asset.id)
      );
      if (nextAssets.length !== assets.length) {
        setUndoStack((prev) => [
          ...prev,
          { type: "bundle", layer: currentLayer, assets: cloneAssetList(assets) },
        ]);
        setRedoStack([]);
        setAssets(nextAssets);
      }
      return { assetsAfter: nextAssets };
    } catch (err) {
      console.warn("Failed to prune unreferenced assets", err);
      return { assetsAfter: assets };
    }
  }, [assets, currentLayer, objects, setAssets, setRedoStack, setUndoStack, tokens]);

  const prepareProjectState = useCallback(
    (assetsAfter) => ({
      version: 1,
      name: projectNameRef.current,
      rows,
      cols,
      tileSize,
      maps,
      objects,
      tokens,
      assets: assetsAfter || assets,
      settings: {
        activeLayer: currentLayer,
        brushSize,
        snapToGrid: !!gridSettings?.snap,
        engine,
        layerVisibility,
        tokensVisible,
        tokenHUDVisible,
        tokenHUDShowInitiative,
        assetGroup,
        showGridLines,
        canvasOpacity,
        canvasSpacing,
        canvasBlendMode,
        canvasSmoothing,
        gridSettings,
        naturalSettings,
      },
    }),
    [
      assetGroup,
      assets,
      brushSize,
      canvasBlendMode,
      canvasOpacity,
      canvasSpacing,
      canvasSmoothing,
      cols,
      currentLayer,
      engine,
      gridSettings,
      layerVisibility,
      maps,
      naturalSettings,
      objects,
      projectNameRef,
      rows,
      tileSize,
      tokenHUDShowInitiative,
      tokenHUDVisible,
      tokens,
      tokensVisible,
      showGridLines,
    ]
  );

  const refreshAssetsFromFilesystem = useCallback(async () => {
    const fsAssets = await loadAssetsFromStoredParent();
    if (Array.isArray(fsAssets) && fsAssets.length) {
      setAssets(fsAssets);
      if (fsAssets[0]) {
        setSelectedAssetId(fsAssets[0].id);
      }
    }
  }, [loadAssetsFromStoredParent, setAssets, setSelectedAssetId]);

  const saveProject = useCallback(async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) {
      setNeedsAssetsFolder(true);
      showToast("Select an Account Save Folder to save.", "warning");
      return;
    }

    const hasLoaded = hasCurrentProjectDir?.() === true;
    if (!hasLoaded) {
      const defaultName = projectNameRef.current || "My Map";
      const name = await promptUser("Name this map", defaultName);
      if (!name && name !== "") return;
      projectNameRef.current = name || defaultName;
    }

    const { assetsAfter } = pruneUnreferencedAssets();
    const projectState = prepareProjectState(assetsAfter);

    const response = hasLoaded
      ? await saveProjectManager(projectState, {
          canvasRefs,
          mapName: projectNameRef.current,
        })
      : await saveProjectAsManager(projectState, {
          canvasRefs,
          mapName: projectNameRef.current,
        });

    if (!response?.ok) {
      showToast("Failed to save project. Try export.", "error");
      return;
    }

    showToast(response.message || "Project saved.", "success");
    await refreshAssetsFromFilesystem();
  }, [
    canvasRefs,
    hasCurrentProjectDir,
    isAssetsFolderConfigured,
    prepareProjectState,
    projectNameRef,
    promptUser,
    pruneUnreferencedAssets,
    refreshAssetsFromFilesystem,
    saveProjectAsManager,
    saveProjectManager,
    setNeedsAssetsFolder,
    showToast,
  ]);

  const saveProjectAs = useCallback(async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) {
      setNeedsAssetsFolder(true);
      showToast("Select an Account Save Folder to save.", "warning");
      return;
    }

    const defaultName = projectNameRef.current || "My Map";
    const name = await promptUser("Save As - map name", defaultName);
    if (!name && name !== "") return;
    projectNameRef.current = name || defaultName;

    const { assetsAfter } = pruneUnreferencedAssets();
    const projectState = prepareProjectState(assetsAfter);
    const response = await saveProjectAsManager(projectState, {
      canvasRefs,
      mapName: projectNameRef.current,
    });

    if (!response?.ok) {
      showToast("Failed to save project.", "error");
      return;
    }

    showToast(response.message || "Project saved.", "success");
    await refreshAssetsFromFilesystem();
  }, [
    canvasRefs,
    isAssetsFolderConfigured,
    prepareProjectState,
    projectNameRef,
    promptUser,
    pruneUnreferencedAssets,
    refreshAssetsFromFilesystem,
    saveProjectAsManager,
    setNeedsAssetsFolder,
    showToast,
  ]);

  return { saveProject, saveProjectAs };
}

export default useLegacyProjectSaving;
