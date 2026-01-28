import { useCallback, useMemo, useState } from "react";
import { createDefaultLayers } from "../../utils.js";

export function useLegacyProjectLoading({
  isAssetsFolderConfigured,
  setNeedsAssetsFolder,
  setAssetsFolderDialogOpen,
  showToast,
  listMaps,
  loadProjectById,
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
  setLayers,
  setCurrentLayer,
  setLayerVisibility,
}) {
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [mapsList, setMapsList] = useState([]);

  const normalizeLoadedLayers = useMemo(
    () => (dataLayers, dataMaps) => {
      if (Array.isArray(dataLayers) && dataLayers.length) {
        return dataLayers
          .map((layer) => {
            if (typeof layer === "string") return { id: layer, name: layer };
            if (layer && layer.id) {
              return { id: layer.id, name: layer.name || layer.id };
            }
            return null;
          })
          .filter(Boolean);
      }

      if (dataMaps && typeof dataMaps === "object") {
        return Object.keys(dataMaps).map((key) => ({
          id: key,
          name: key
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        }));
      }

      return createDefaultLayers();
    },
    []
  );

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
      if (!entry?.id) return;
      const result = await loadProjectById(entry.id);
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

      const nextLayers = normalizeLoadedLayers(data.layers, data.maps);
      setLayers(nextLayers);
      if (data.settings?.layerVisibility) {
        setLayerVisibility(data.settings.layerVisibility);
      }
      const activeLayerId = data.settings?.activeLayer;
      const resolvedActiveLayer = nextLayers.find((layer) => layer.id === activeLayerId)
        ? activeLayerId
        : nextLayers[0]?.id;
      if (resolvedActiveLayer) {
        setCurrentLayer(resolvedActiveLayer);
      }

      setTimeout(() => {
        if (data.canvases) {
          const layerOrder = nextLayers.map((layer) => layer.id);
          for (const layer of layerOrder) {
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
      loadProjectById,
      normalizeLoadedLayers,
      setAssets,
      setColsInput,
      setMaps,
      setObjects,
      setRowsInput,
      setSelectedAssetId,
      setTokens,
      setLayers,
      setCurrentLayer,
      setLayerVisibility,
      showToast,
      projectNameRef,
    ]
  );

  const handleDeleteMapFromList = useCallback(
    async (entry) => {
      if (!entry?.id) return;
      const ok = await confirmUser(
        `Delete map "${entry.name || entry.id}"?\nThis cannot be undone.`,
        { title: "Delete Map", okText: "Delete", cancelText: "Cancel" }
      );
      if (!ok) return;
      const response = await deleteMap(entry.id);
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
