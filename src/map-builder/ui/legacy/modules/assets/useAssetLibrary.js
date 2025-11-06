import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uid } from "../../utils.js";
import {
  loadGlobalAssets,
  saveGlobalAssets,
  loadAssetsFromStoredParent,
  chooseAssetsFolder,
  isAssetsFolderConfigured,
} from "../../../../application/save-load/index.js";

const DEFAULT_NATURAL_SETTINGS = {
  randomRotation: false,
  randomFlipX: false,
  randomFlipY: false,
  randomSize: { enabled: false, min: 1, max: 1 },
  randomOpacity: { enabled: false, min: 1, max: 1 },
  randomVariant: true,
};

const normalizeStamp = (stamp = {}) => ({
  sizeTiles: Number.isFinite(stamp.sizeTiles) ? stamp.sizeTiles : 1,
  sizeCols: Number.isFinite(stamp.sizeCols)
    ? stamp.sizeCols
    : Number.isFinite(stamp.sizeTiles)
    ? stamp.sizeTiles
    : 1,
  sizeRows: Number.isFinite(stamp.sizeRows)
    ? stamp.sizeRows
    : Number.isFinite(stamp.sizeTiles)
    ? stamp.sizeTiles
    : 1,
  rotation: Number.isFinite(stamp.rotation) ? stamp.rotation : 0,
  flipX: !!stamp.flipX,
  flipY: !!stamp.flipY,
  opacity: Number.isFinite(stamp.opacity) ? stamp.opacity : 1,
  snapToGrid: stamp.snapToGrid ?? true,
  snapStep: Number.isFinite(stamp.snapStep) ? stamp.snapStep : 1,
  linkXY: !!stamp.linkXY,
});

const normalizeNaturalSettings = (settings = {}) => ({
  randomRotation: !!settings.randomRotation,
  randomFlipX: !!settings.randomFlipX,
  randomFlipY: !!settings.randomFlipY,
  randomSize: {
    enabled: !!settings.randomSize?.enabled,
    min: Number.isFinite(settings.randomSize?.min) ? settings.randomSize.min : 1,
    max: Number.isFinite(settings.randomSize?.max) ? settings.randomSize.max : 1,
  },
  randomOpacity: {
    enabled: !!settings.randomOpacity?.enabled,
    min: Number.isFinite(settings.randomOpacity?.min) ? settings.randomOpacity.min : 1,
    max: Number.isFinite(settings.randomOpacity?.max) ? settings.randomOpacity.max : 1,
  },
  randomVariant: settings.randomVariant ?? true,
});

export function useAssetLibrary({
  setEngine,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  setCanvasColor,
}) {
  const [assets, setAssets] = useState(() => []);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetGroup, setAssetGroup] = useState("image");
  const [showAssetKindMenu, setShowAssetKindMenu] = useState(true);
  const [showAssetPreviews, setShowAssetPreviews] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorKind, setCreatorKind] = useState("image");
  const [editingAsset, setEditingAsset] = useState(null);
  const [addColorMode, setAddColorMode] = useState("palette");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#66ccff");
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#ffffff");
  const [newLabelSize, setNewLabelSize] = useState(28);
  const [newLabelFont, setNewLabelFont] = useState("Arial");
  const [flowHue, setFlowHue] = useState(200);
  const [flowSat, setFlowSat] = useState(70);
  const [flowLight, setFlowLight] = useState(55);
  const [assetStamp, setAssetStamp] = useState(() => normalizeStamp());
  const [naturalSettings, setNaturalSettings] = useState(() =>
    normalizeNaturalSettings(DEFAULT_NATURAL_SETTINGS)
  );
  const [needsAssetsFolder, setNeedsAssetsFolder] = useState(false);

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
  }, []);

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

  const getAsset = useCallback(
    (id) => assets.find((asset) => asset.id === id) || null,
    [assets]
  );

  const selectedAsset = useMemo(
    () => (selectedAssetId ? getAsset(selectedAssetId) : null),
    [selectedAssetId, getAsset]
  );

  const selectAsset = useCallback(
    (id) => {
      const asset = getAsset(id);
      setSelectedAssetId(id);
      setCreatorOpen(false);
      if (!asset) return;

      if (asset.kind === "token" || asset.kind === "tokenGroup") {
        try {
          setZoomToolActive?.(false);
          setPanToolActive?.(false);
        } catch (err) {
          console.warn("Failed to disable zoom/pan tools", err);
        }
        setInteractionMode?.("draw");
        setEngine?.("grid");
      } else if (asset.kind === "color") {
        if (asset.color) setCanvasColor?.(asset.color);
      } else if (asset.allowedEngines?.length) {
        const preferred = asset.defaultEngine || asset.allowedEngines[0] || "canvas";
        if (asset.allowedEngines.includes(preferred)) {
          setEngine?.(preferred);
        } else {
          setEngine?.(asset.allowedEngines[0]);
        }
      } else {
        setEngine?.(asset.defaultEngine || "canvas");
      }
    },
    [getAsset, setCanvasColor, setEngine, setInteractionMode, setPanToolActive, setZoomToolActive]
  );

  const openCreator = useCallback((kind) => {
    setCreatorKind(kind);
    setCreatorOpen(true);
  }, []);

  const handleCreatorCreate = useCallback(
    (asset, group) => {
      if (!asset) return;
      const withId = { ...asset, id: uid() };
      if ((withId.kind === "image" || withId.kind === "token") && withId.src && !withId.img) {
        const img = new Image();
        img.src = withId.src;
        withId.img = img;
      }
      setAssets((prev) => {
        const next = [withId, ...prev];
        try {
          saveGlobalAssets(next);
        } catch (err) {
          console.warn("Failed to persist created asset", err);
        }
        return next;
      });
      if (group === "material") setAssetGroup("material");
      else if (group === "natural") setAssetGroup("natural");
      else if (group === "token") setAssetGroup("token");
      else setAssetGroup("image");
      setSelectedAssetId(withId.id);
      setEngine?.("grid");
      setCreatorOpen(false);
    },
    [setEngine]
  );

  const updateAssetById = useCallback((id, patch) => {
    setAssets((prev) => prev.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)));
  }, []);

  const mapAssetToCreatorKind = useCallback((asset) => {
    if (!asset) return "image";
    if (asset.kind === "color") return "material";
    if (asset.kind === "natural") return "natural";
    if (asset.kind === "token" || asset.kind === "tokenGroup") return "token";
    if (asset.kind === "image" && asset.labelMeta) return "text";
    return "image";
  }, []);

  const openEditAsset = useCallback(
    (asset) => {
      setEditingAsset(asset);
      setCreatorKind(mapAssetToCreatorKind(asset));
      setCreatorOpen(true);
    },
    [mapAssetToCreatorKind]
  );

  useEffect(() => {
    const ensureSelection = (predicate) => {
      const current = selectedAsset;
      if (current && predicate(current)) return;
      const next = assets.find(predicate);
      if (next) setSelectedAssetId(next.id);
    };

    setCreatorOpen(false);

    if (assetGroup === "image") {
      ensureSelection((asset) => asset.kind === "image");
    } else if (assetGroup === "material") {
      ensureSelection((asset) => asset.kind === "color");
    } else if (assetGroup === "token") {
      ensureSelection((asset) => asset.kind === "token" || asset.kind === "tokenGroup");
      setEngine?.("grid");
    } else if (assetGroup === "natural") {
      ensureSelection((asset) => asset.kind === "natural");
      setEngine?.("grid");
    }
  }, [assetGroup, assets, selectedAsset, setEngine]);

  const promptChooseAssetsFolder = useCallback(async () => {
    const result = await chooseAssetsFolder();
    if (result?.ok) {
      setNeedsAssetsFolder(false);
      const list = result.assets || [];
      globalAssetsRef.current = list;
      setAssets(list);
      if (list[0]) setSelectedAssetId(list[0].id);
    }
  }, []);

  const handleUpload = useCallback(
    async (file, promptUser) => {
      if (!file) return;
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        const aspectRatio = img.width / img.height || 1;
        const defaultName = file.name.replace(/\.[^/.]+$/, "");
        const nameInput = await promptUser?.("Name this asset", defaultName);
        const name = (nameInput ?? defaultName) || defaultName;
        const asset = {
          id: uid(),
          name,
          kind: "image",
          src,
          aspectRatio,
          defaultEngine: "grid",
          allowedEngines: ["grid", "canvas"],
          defaults: { sizeTiles: 1, opacity: 1, snap: true },
          img,
        };
        setAssets((prev) => [asset, ...prev]);
        setSelectedAssetId(asset.id);
        setEngine?.(asset.defaultEngine);
      };
      img.src = src;
    },
    [setEngine]
  );

  const handleCreateNatural = useCallback(
    async (filesOrVariants, nameInput) => {
      const name = (nameInput || "Natural").trim() || "Natural";
      if (!filesOrVariants) return;

      let variants = [];
      if (filesOrVariants instanceof FileList || (Array.isArray(filesOrVariants) && filesOrVariants[0] instanceof File)) {
        const fileArr = Array.from(filesOrVariants || []).slice(0, 16);
        if (!fileArr.length) return;
        const readOne = (file) =>
          new Promise((resolve) => {
            const src = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              resolve({ src, aspectRatio: img.width && img.height ? img.width / img.height : 1 });
            };
            img.src = src;
          });
        variants = await Promise.all(fileArr.map(readOne));
      } else {
        variants = Array.isArray(filesOrVariants) ? filesOrVariants.slice(0, 16) : [];
      }
      if (!variants.length) return;

      const asset = {
        id: uid(),
        name,
        kind: "natural",
        variants,
        defaultEngine: "grid",
        allowedEngines: [],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
      };
      setAssets((prev) => [asset, ...prev]);
      setSelectedAssetId(asset.id);
      setAssetGroup("natural");
      setEngine?.("grid");
    },
    [setEngine]
  );

  const createTextLabelAsset = useCallback(
    (promptUser) => {
      const text = (newLabelText || "Label").trim();
      const size = Math.max(8, Math.min(128, parseInt(newLabelSize) || 28));
      const color = newLabelColor || "#ffffff";
      const font = newLabelFont || "Arial";
      const padding = Math.round(size * 0.35);

      const measureCanvas = document.createElement("canvas");
      const mctx = measureCanvas.getContext("2d");
      mctx.font = `${size}px ${font}`;
      const metrics = mctx.measureText(text);
      const textW = Math.ceil(metrics.width);
      const textH = Math.ceil(size * 1.2);
      const w = Math.max(1, textW + padding * 2);
      const h = Math.max(1, textH + padding * 2);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${size}px ${font}`;
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
      ctx.fillText(text, padding, padding);

      const src = canvas.toDataURL("image/png");
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height || 1;
        const asset = {
          id: uid(),
          name: text,
          kind: "image",
          src,
          aspectRatio,
          defaultEngine: "grid",
          allowedEngines: ["grid", "canvas"],
          defaults: { sizeTiles: 1, opacity: 1, snap: true },
          img,
        };
        setAssets((prev) => [asset, ...prev]);
        setSelectedAssetId(asset.id);
        setEngine?.(asset.defaultEngine);
        setNewLabelText("");
      };
      img.src = src;
    },
    [newLabelColor, newLabelFont, newLabelSize, newLabelText, setEngine]
  );

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
  };
}
