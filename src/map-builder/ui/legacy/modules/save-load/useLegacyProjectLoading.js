import { useCallback, useState } from "react";

export function useLegacyProjectLoading({
  isAssetsFolderConfigured,
  setNeedsAssetsFolder,
  setAssetsFolderDialogOpen,
  showToast,
  listMaps,
  loadProjectFromDirectory,
  setRowsInput,
  setColsInput,
  setMaps,
  setObjects,
  setTokens,
  setAssets,
  setSelectedAssetId,
  projectNameRef,
  canvasRefs,
  confirmUser,
  deleteMap,
}) {
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [mapsList, setMapsList] = useState([]);

  const openLoadModal = useCallback(async () => {
    const configured = await isAssetsFolderConfigured();
    if (!configured) {
      setNeedsAssetsFolder(true);
      setAssetsFolderDialogOpen(true);
      showToast("Select an Account Save Folder first.", "warning");
      return;
    }
    const items = await listMaps();
    setMapsList(items || []);
    setLoadModalOpen(true);
  }, [
    isAssetsFolderConfigured,
    listMaps,
    setNeedsAssetsFolder,
    setAssetsFolderDialogOpen,
    showToast,
  ]);

  const closeLoadModal = useCallback(() => {
    setLoadModalOpen(false);
  }, []);

  const handleLoadMapFromList = useCallback(
    async (entry) => {
      if (!entry?.dirHandle) return;
      const result = await loadProjectFromDirectory(entry.dirHandle);
      if (!result?.ok || !result?.data) return;
      const data = result.data;
      setRowsInput(String(Math.min(200, data.rows || 20)));
      setColsInput(String(Math.min(200, data.cols || 20)));
      if (data.maps) setMaps(data.maps);
      if (data.objects) setObjects(data.objects);
      if (data.tokens) setTokens(data.tokens);
      if (data.assets) {
        const hydrated = data.assets.map((asset) => {
          if ((asset.kind === "image" || asset.kind === "token") && asset.src && !asset.img) {
            const img = new Image();
            img.src = asset.src;
            return { ...asset, img };
          }
          return asset;
        });
        setAssets(hydrated);
        if (hydrated[0]) {
          setSelectedAssetId(hydrated[0].id);
        }
      }
      projectNameRef.current = data.name || data.settings?.name || "My Map";

      setTimeout(() => {
        if (data.canvases) {
          for (const layer of ["background", "base", "sky"]) {
            const dataUrl = data.canvases?.[layer];
            if (!dataUrl) continue;
            const canvas = canvasRefs[layer]?.current;
            if (!canvas) continue;
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = dataUrl;
          }
        } else if (data.canvasDataUrl) {
          const canvas = canvasRefs.base?.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = data.canvasDataUrl;
          }
        }
      }, 0);

      setLoadModalOpen(false);
      showToast("Project loaded.", "success");
    },
    [
      canvasRefs,
      loadProjectFromDirectory,
      setAssets,
      setColsInput,
      setMaps,
      setObjects,
      setRowsInput,
      setSelectedAssetId,
      setTokens,
      showToast,
      projectNameRef,
    ]
  );

  const handleDeleteMapFromList = useCallback(
    async (entry) => {
      if (!entry?.folderName) return;
      const ok = await confirmUser(
        `Delete map "${entry.name || entry.folderName}"?\nThis cannot be undone.`,
        { title: "Delete Map", okText: "Delete", cancelText: "Cancel" }
      );
      if (!ok) return;
      const response = await deleteMap(entry.folderName);
      if (!response?.ok) {
        showToast(response?.message || "Failed to delete map.", "error");
        return;
      }
      showToast("Map deleted.", "success");
      const items = await listMaps();
      setMapsList(items || []);
    },
    [confirmUser, deleteMap, listMaps, showToast]
  );

  return {
    loadModalOpen,
    mapsList,
    openLoadModal,
    closeLoadModal,
    handleLoadMapFromList,
    handleDeleteMapFromList,
  };
}

export default useLegacyProjectLoading;
