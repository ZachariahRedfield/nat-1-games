import { useCallback } from "react";
import { uid, deepCopyObjects } from "../../utils.js";

export function useAssetExports({
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
}) {
  const regenerateLabelInstance = useCallback(
    (assetId, meta) => {
      const asset = assets.find((item) => item.id === assetId);
      if (!asset || !selectedObj) return;
      setUndoStack((prev) => [
        ...prev,
        {
          type: "bundle",
          layer: currentLayer,
          assets: assets.map((item) => ({ ...item })),
          objects: deepCopyObjects(objects[currentLayer] || []),
        },
      ]);
      setRedoStack([]);

      const text = meta?.text ?? asset.labelMeta?.text ?? "Label";
      const size = Math.max(8, Math.min(128, parseInt(meta?.size ?? asset.labelMeta?.size ?? 28) || 28));
      const color = meta?.color ?? asset.labelMeta?.color ?? "#ffffff";
      const font = meta?.font ?? asset.labelMeta?.font ?? "Arial";
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
        const newAsset = {
          id: uid(),
          name: asset.name || text,
          kind: "image",
          src,
          img,
          aspectRatio: img.width && img.height ? img.width / img.height : asset.aspectRatio || 1,
          defaultEngine: "grid",
          allowedEngines: ["grid", "canvas"],
          defaults: asset.defaults || { sizeTiles: 1, opacity: 1, snap: true },
          hiddenFromUI: true,
          labelMeta: { text, color, font, size },
        };
        setAssets((prev) => [newAsset, ...prev]);
        updateObjectById(currentLayer, selectedObj.id, { assetId: newAsset.id });
      };
      img.src = src;
    },
    [assets, currentLayer, objects, selectedObj, setAssets, setRedoStack, setUndoStack, updateObjectById]
  );

  const saveSelectionAsAsset = useCallback(async () => {
    if (!selectedObj) return;
    const asset = assets.find((item) => item.id === selectedObj.assetId);
    if (!asset) return;
    const wPx = Math.max(1, Math.round(selectedObj.wTiles * tileSize));
    const hPx = Math.max(1, Math.round(selectedObj.hTiles * tileSize));

    const renderAndSave = async (src) => {
      const canvas = document.createElement("canvas");
      canvas.width = wPx;
      canvas.height = hPx;
      const ctx = canvas.getContext("2d");
      const baseImg = new Image();
      baseImg.onload = async () => {
        ctx.save();
        ctx.translate(wPx / 2, hPx / 2);
        const rot = ((selectedObj.rotation || 0) * Math.PI) / 180;
        ctx.rotate(rot);
        ctx.scale(selectedObj.flipX ? -1 : 1, selectedObj.flipY ? -1 : 1);
        ctx.globalAlpha = selectedObj.opacity ?? 1;
        ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
        ctx.restore();
        const dataUrl = canvas.toDataURL("image/png");
        const nameDefault = `${asset.name}-variant`;
        const nameInput = await promptUser?.("Name this saved asset", nameDefault);
        const name = (nameInput ?? nameDefault) || nameDefault;
        const newImg = new Image();
        newImg.src = dataUrl;
        const newAsset = {
          id: uid(),
          name,
          kind: "image",
          src: dataUrl,
          aspectRatio: wPx / hPx || 1,
          defaultEngine: "grid",
          allowedEngines: ["grid", "canvas"],
          defaults: { sizeTiles: selectedObj.wTiles || 1, opacity: selectedObj.opacity ?? 1, snap: true },
          img: newImg,
        };
        setAssets((prev) => [newAsset, ...prev]);
        setSelectedAssetId(newAsset.id);
        setEngine?.("grid");
      };
      baseImg.src = src;
    };

    if (asset.kind === "image") {
      await renderAndSave(asset.img?.src || asset.src);
    } else if (asset.kind === "natural") {
      const index = selectedObj.variantIndex || 0;
      const variant = Array.isArray(asset.variants) && asset.variants[index] ? asset.variants[index] : null;
      if (!variant?.src) return;
      await renderAndSave(variant.src);
      setAssetGroup?.("image");
    }
  }, [assets, promptUser, selectedObj, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]);

  const saveSelectedTokenAsAsset = useCallback(async () => {
    if (!selectedToken) return;
    const asset = assets.find((item) => item.id === selectedToken.assetId);
    if (!asset) return;
    const wPx = Math.max(1, Math.round((selectedToken.wTiles || 1) * tileSize));
    const hPx = Math.max(1, Math.round((selectedToken.hTiles || 1) * tileSize));
    const canvas = document.createElement("canvas");
    canvas.width = wPx;
    canvas.height = hPx;
    const ctx = canvas.getContext("2d");
    const baseImg = new Image();
    baseImg.onload = async () => {
      ctx.save();
      ctx.translate(wPx / 2, hPx / 2);
      const rot = ((selectedToken.rotation || 0) * Math.PI) / 180;
      ctx.rotate(rot);
      ctx.scale(selectedToken.flipX ? -1 : 1, selectedToken.flipY ? -1 : 1);
      ctx.globalAlpha = selectedToken.opacity ?? 1;
      ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
      const dataUrl = canvas.toDataURL("image/png");
      const nameDefault = `${asset.name}-variant`;
      const nameInput = await promptUser?.("Name this saved token", nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
      const newAsset = {
        id: uid(),
        name,
        kind: "token",
        src: dataUrl,
        aspectRatio: wPx / hPx || 1,
        defaultEngine: "grid",
        allowedEngines: [],
        defaults: { sizeTiles: selectedToken.wTiles || 1, opacity: selectedToken.opacity ?? 1, snap: true },
        glowDefault: selectedToken.glowColor || asset.glowDefault || "#7dd3fc",
      };
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setAssetGroup?.("token");
      setEngine?.("grid");
    };
    baseImg.src = asset.src;
  }, [assets, promptUser, selectedToken, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]);

  const saveMultipleObjectsAsNaturalGroup = useCallback(
    async (objectsToSave) => {
      const variants = [];
      for (const obj of objectsToSave || []) {
        const asset = assets.find((item) => item.id === obj.assetId);
        if (!asset) continue;
        let src = null;
        if (asset.kind === "image") src = asset.img?.src || asset.src;
        else if (asset.kind === "natural") {
          const index = obj.variantIndex || 0;
          const variant = Array.isArray(asset.variants) && asset.variants[index] ? asset.variants[index] : null;
          src = variant?.src || null;
        }
        if (!src) continue;
        const wPx = Math.max(1, Math.round(obj.wTiles * tileSize));
        const hPx = Math.max(1, Math.round(obj.hTiles * tileSize));
        const canvas = document.createElement("canvas");
        canvas.width = wPx;
        canvas.height = hPx;
        const ctx = canvas.getContext("2d");
        const baseImg = new Image();
        await new Promise((resolve) => {
          baseImg.onload = resolve;
          baseImg.src = src;
        });
        ctx.save();
        ctx.translate(wPx / 2, hPx / 2);
        const rot = ((obj.rotation || 0) * Math.PI) / 180;
        ctx.rotate(rot);
        ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.drawImage(baseImg, -wPx / 2, -hPx / 2, wPx, hPx);
        ctx.restore();
        const dataUrl = canvas.toDataURL("image/png");
        variants.push({ src: dataUrl, aspectRatio: wPx / hPx || 1 });
      }
      if (!variants.length) return;
      const nameDefault = "Natural Group";
      const nameInput = await promptUser?.("Name this Natural group", nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
      const newAsset = {
        id: uid(),
        name,
        kind: "natural",
        variants,
        defaultEngine: "grid",
        allowedEngines: [],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
      };
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setAssetGroup?.("natural");
      setEngine?.("grid");
    },
    [assets, promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveMultipleObjectsAsMergedImage = useCallback(
    async (objectsToSave) => {
      if (!objectsToSave?.length) return;
      const minRow = Math.min(...objectsToSave.map((obj) => obj.row));
      const minCol = Math.min(...objectsToSave.map((obj) => obj.col));
      const maxRow = Math.max(...objectsToSave.map((obj) => obj.row + obj.hTiles));
      const maxCol = Math.max(...objectsToSave.map((obj) => obj.col + obj.wTiles));
      const wPx = Math.max(1, Math.round((maxCol - minCol) * tileSize));
      const hPx = Math.max(1, Math.round((maxRow - minRow) * tileSize));
      const canvas = document.createElement("canvas");
      canvas.width = wPx;
      canvas.height = hPx;
      const ctx = canvas.getContext("2d");
      for (const obj of objectsToSave) {
        const asset = assets.find((item) => item.id === obj.assetId);
        if (!asset) continue;
        let src = null;
        if (asset.kind === "image") src = asset.img?.src || asset.src;
        else if (asset.kind === "natural") {
          const index = obj.variantIndex || 0;
          const variant = Array.isArray(asset.variants) && asset.variants[index] ? asset.variants[index] : null;
          src = variant?.src || null;
        }
        if (!src) continue;
        const baseImg = new Image();
        await new Promise((resolve) => {
          baseImg.onload = resolve;
          baseImg.src = src;
        });
        const wObj = Math.max(1, Math.round(obj.wTiles * tileSize));
        const hObj = Math.max(1, Math.round(obj.hTiles * tileSize));
        const cx = Math.round((obj.col - minCol) * tileSize + wObj / 2);
        const cy = Math.round((obj.row - minRow) * tileSize + hObj / 2);
        ctx.save();
        ctx.translate(cx, cy);
        const rot = ((obj.rotation || 0) * Math.PI) / 180;
        ctx.rotate(rot);
        ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.drawImage(baseImg, -wObj / 2, -hObj / 2, wObj, hObj);
        ctx.restore();
      }
      const dataUrl = canvas.toDataURL("image/png");
      const nameDefault = "Merged Image";
      const nameInput = await promptUser?.("Name this merged image", nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
      const newImg = new Image();
      newImg.src = dataUrl;
      const newAsset = {
        id: uid(),
        name,
        kind: "image",
        src: dataUrl,
        aspectRatio: wPx / hPx || 1,
        defaultEngine: "grid",
        allowedEngines: ["grid", "canvas"],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
        img: newImg,
      };
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setAssetGroup?.("image");
      setEngine?.("grid");
    },
    [assets, promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId, tileSize]
  );

  const saveSelectedTokensAsGroup = useCallback(
    async (tokens) => {
      if (!tokens?.length) return;
      const ordered = [...tokens].sort((a, b) => (a.col - b.col) || (a.row - b.row));
      const members = ordered.map((token) => ({ assetId: token.assetId }));
      const nameDefault = "Token Group";
      const nameInput = await promptUser?.("Name this token group", nameDefault);
      const name = (nameInput ?? nameDefault) || nameDefault;
      const newAsset = {
        id: uid(),
        name,
        kind: "tokenGroup",
        members,
        defaultEngine: "grid",
        allowedEngines: [],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
      };
      setAssets((prev) => [newAsset, ...prev]);
      setSelectedAssetId(newAsset.id);
      setAssetGroup?.("token");
      setEngine?.("grid");
    },
    [promptUser, setAssetGroup, setAssets, setEngine, setSelectedAssetId]
  );

  const saveCurrentSelection = useCallback(async () => {
    const tokenCount = selectedTokensList?.length || 0;
    const objectCount = selectedObjsList?.length || 0;
    if (tokenCount > 0 && objectCount > 0) {
      showToast?.("Mixed selection not supported. Select only images or only tokens.", "warning", 3500);
      return;
    }
    if (tokenCount > 1) {
      await saveSelectedTokensAsGroup(selectedTokensList);
      return;
    }
    if (objectCount > 1) {
      const choice = await confirmUser?.(
        "Save as Natural group?\nOK: Natural Group (each selection becomes a variant)\nCancel: Merge into single Image"
      );
      if (choice) {
        await saveMultipleObjectsAsNaturalGroup(selectedObjsList);
      } else {
        await saveMultipleObjectsAsMergedImage(selectedObjsList);
      }
      return;
    }
    if (tokenCount === 1) {
      await saveSelectedTokenAsAsset();
      return;
    }
    if (objectCount === 1) {
      await saveSelectionAsAsset();
    }
  }, [
    confirmUser,
    saveMultipleObjectsAsMergedImage,
    saveMultipleObjectsAsNaturalGroup,
    saveSelectedTokenAsAsset,
    saveSelectedTokensAsGroup,
    saveSelectionAsAsset,
    selectedObjsList,
    selectedTokensList,
    showToast,
  ]);

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
