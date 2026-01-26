import { useCallback, useEffect, useRef } from "react";
import {
  chooseAssetsFolder,
  isAssetsFolderConfigured,
  loadAssetsFromStoredParent,
  loadGlobalAssets,
  saveGlobalAssets,
} from "../../../../../application/save-load/index.js";

function useAssetPersistence({
  assets,
  setAssets,
  setNeedsAssetsFolder,
  setSelectedAssetId,
  setAssetsFolderDialogOpen,
  showToast,
}) {
  const globalAssetsRef = useRef([]);
  const persistTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const configured = await isAssetsFolderConfigured();
      const fsAssets = configured ? await loadAssetsFromStoredParent() : [];
      const global = await loadGlobalAssets();

      if (!mounted) return;

      setNeedsAssetsFolder(!configured);
      setAssetsFolderDialogOpen(!configured);

      const gMap = new Map(
        (Array.isArray(global) ? global : [])
          .filter(Boolean)
          .map((asset) => [asset.id, asset])
      );
      const fMap = new Map(
        (Array.isArray(fsAssets) ? fsAssets : [])
          .filter(Boolean)
          .map((asset) => [asset.id, asset])
      );

      const merged = [];
      const allIds = new Set([...gMap.keys(), ...fMap.keys()]);
      for (const id of allIds) {
        const gAsset = gMap.get(id);
        const fAsset = fMap.get(id);
        if (gAsset && fAsset) {
          merged.push({ ...fAsset, ...gAsset });
        } else if (fAsset) {
          merged.push({ ...fAsset });
        } else if (gAsset) {
          merged.push({ ...gAsset });
        }
      }

      const byNameKind = new Map();
      for (const asset of merged) {
        const key = `${asset.kind || ""}:${(asset.name || "").toLowerCase()}`;
        const existing = byNameKind.get(key);
        if (!existing) {
          byNameKind.set(key, asset);
        } else {
          if (!asset.stampDefaults && existing.stampDefaults) {
            asset.stampDefaults = existing.stampDefaults;
          }
          if (!existing.stampDefaults && asset.stampDefaults) {
            existing.stampDefaults = asset.stampDefaults;
          }
          if (!asset.naturalDefaults && existing.naturalDefaults) {
            asset.naturalDefaults = existing.naturalDefaults;
          }
          if (!existing.naturalDefaults && asset.naturalDefaults) {
            existing.naturalDefaults = asset.naturalDefaults;
          }
          if (!asset.canvasBrushDefaults && existing.canvasBrushDefaults) {
            asset.canvasBrushDefaults = existing.canvasBrushDefaults;
          }
          if (!existing.canvasBrushDefaults && asset.canvasBrushDefaults) {
            existing.canvasBrushDefaults = asset.canvasBrushDefaults;
          }
        }
      }

      globalAssetsRef.current = merged;
      setAssets(merged);
      if (merged[0]) setSelectedAssetId(merged[0].id);
    })();

    return () => {
      mounted = false;
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [setAssets, setNeedsAssetsFolder, setSelectedAssetId, setAssetsFolderDialogOpen]);

  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      saveGlobalAssets(assets);
    }, 400);
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [assets]);

  const promptChooseAssetsFolder = useCallback(async () => {
    const result = await chooseAssetsFolder();
    if (result?.ok) {
      setNeedsAssetsFolder(false);
      setAssetsFolderDialogOpen(false);
      const list = result.assets || [];
      globalAssetsRef.current = list;
      setAssets(list);
      if (list[0]) setSelectedAssetId(list[0].id);
      return;
    }

    if (result?.reason === "unsupported") {
      showToast?.(
        "Selecting an assets folder isn't supported on this device. Try using desktop Chrome or Edge.",
        "warning",
        6000
      );
    } else if (result && showToast) {
      showToast("Failed to open assets folder.", "error");
    }
  }, [
    setAssets,
    setNeedsAssetsFolder,
    setSelectedAssetId,
    setAssetsFolderDialogOpen,
    showToast,
  ]);

  return { promptChooseAssetsFolder };
}

export { useAssetPersistence };
