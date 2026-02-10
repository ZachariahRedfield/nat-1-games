import { useCallback, useState } from "react";

function cloneAssetList(assets) {
  return assets.map((asset) => ({ ...asset }));
}

export function useLegacyProjectSaving({
  layers,
  isAssetsFolderConfigured,
  showToast,
  setNeedsAssetsFolder,
  setAssetsFolderDialogOpen,
  hasCurrentProjectDir,
  getCurrentProjectInfo,
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
  const [lastSaveResult, setLastSaveResult] = useState("idle");
  const [lastSaveAt, setLastSaveAt] = useState(null);

  const pruneUnreferencedAssets = useCallback(() => {
    try {
      const referenced = new Set();
      const layerIds = (layers || [])
        .map((layer) => (typeof layer === "string" ? layer : layer?.id))
        .filter(Boolean);
      const keys = layerIds.length ? layerIds : Object.keys(objects || {});
      for (const layer of keys) {
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
  }, [assets, currentLayer, layers, objects, setAssets, setRedoStack, setUndoStack, tokens]);

  const prepareProjectState = useCallback(
    (assetsAfter) => ({
      version: 1,
      name: projectNameRef.current,
      rows,
      cols,
      tileSize,
      layers,
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
        tokensVisible: layerVisibility?.tokens ?? tokensVisible,
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
      layers,
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
      setAssetsFolderDialogOpen(true);
      showToast("Select an Account Save Folder to save.", "warning");
      setLastSaveResult("blocked-assets-folder");
      return;
    }

    const currentProjectInfo = await getCurrentProjectInfo?.();
    const hasLoaded = hasCurrentProjectDir?.() === true && Boolean(currentProjectInfo?.id);
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
      setLastSaveResult("error");
      setLastSaveAt(Date.now());
      return;
    }

    showToast(response.message || "Project saved.", "success");
    setLastSaveResult("success");
    setLastSaveAt(Date.now());
    await refreshAssetsFromFilesystem();
  }, [
    canvasRefs,
    hasCurrentProjectDir,
    getCurrentProjectInfo,
    isAssetsFolderConfigured,
    prepareProjectState,
    projectNameRef,
    promptUser,
    pruneUnreferencedAssets,
    refreshAssetsFromFilesystem,
    saveProjectAsManager,
    saveProjectManager,
    setNeedsAssetsFolder,
    setAssetsFolderDialogOpen,
    showToast,
  ]);

  const saveProjectAs = useCallback(async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) {
      setNeedsAssetsFolder(true);
      setAssetsFolderDialogOpen(true);
      showToast("Select an Account Save Folder to save.", "warning");
      setLastSaveResult("blocked-assets-folder");
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
      setLastSaveResult("error");
      setLastSaveAt(Date.now());
      return;
    }

    showToast(response.message || "Project saved.", "success");
    setLastSaveResult("success");
    setLastSaveAt(Date.now());
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
    setAssetsFolderDialogOpen,
    showToast,
  ]);

  return { saveProject, saveProjectAs, lastSaveResult, lastSaveAt };
}

export default useLegacyProjectSaving;
