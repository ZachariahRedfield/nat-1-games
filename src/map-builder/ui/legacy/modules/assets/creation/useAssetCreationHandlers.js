import { useCallback } from "react";
import { uid } from "../../../utils.js";
import { saveGlobalAssets } from "../../../../../application/save-load/index.js";

function useAssetCreationHandlers({
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
  setEngine,
  setCreatorOpen,
  setCreatorKind,
  setEditingAsset,
  newLabelText,
  setNewLabelText,
  newLabelColor,
  newLabelFont,
  newLabelSize,
}) {
  const openCreator = useCallback((kind) => {
    setCreatorKind(kind);
    setCreatorOpen(true);
  }, [setCreatorKind, setCreatorOpen]);

  const handleCreatorCreate = useCallback((asset, group) => {
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
  }, [setAssetGroup, setAssets, setCreatorOpen, setEngine, setSelectedAssetId]);

  const updateAssetById = useCallback(
    (id, patch) => {
      setAssets((prev) => prev.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)));
    },
    [setAssets]
  );

  const mapAssetToCreatorKind = useCallback((asset) => {
    if (!asset) return "image";
    if (asset.kind === "color") return "material";
    if (asset.kind === "natural") return "natural";
    if (asset.kind === "token" || asset.kind === "tokenGroup") return "token";
    if (asset.kind === "image" && asset.labelMeta) return "text";
    return "image";
  }, []);

  const openEditAsset = useCallback((asset) => {
    setEditingAsset(asset);
    setCreatorKind(mapAssetToCreatorKind(asset));
    setCreatorOpen(true);
  }, [mapAssetToCreatorKind, setCreatorKind, setCreatorOpen, setEditingAsset]);

  const handleUpload = useCallback(async (file, promptUser) => {
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
  }, [setAssets, setEngine, setSelectedAssetId]);

  const handleCreateNatural = useCallback(async (filesOrVariants, nameInput) => {
    const name = (nameInput || "Natural").trim() || "Natural";
    if (!filesOrVariants) return;

    let variants = [];
    if (
      filesOrVariants instanceof FileList ||
      (Array.isArray(filesOrVariants) && filesOrVariants[0] instanceof File)
    ) {
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
  }, [setAssetGroup, setAssets, setEngine, setSelectedAssetId]);

  const createTextLabelAsset = useCallback((promptUser) => {
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
  }, [newLabelColor, newLabelFont, newLabelSize, newLabelText, setAssets, setEngine, setNewLabelText, setSelectedAssetId]);

  return {
    openCreator,
    handleCreatorCreate,
    updateAssetById,
    mapAssetToCreatorKind,
    openEditAsset,
    handleUpload,
    handleCreateNatural,
    createTextLabelAsset,
  };
}

export { useAssetCreationHandlers };
