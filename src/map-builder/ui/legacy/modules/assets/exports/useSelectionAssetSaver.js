import { useCallback } from "react";
import { uid } from "../../../utils.js";

export function useSelectionAssetSaver({
  assets,
  selectedObj,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setEngine,
  setAssetGroup,
}) {
  return useCallback(async () => {
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
}
