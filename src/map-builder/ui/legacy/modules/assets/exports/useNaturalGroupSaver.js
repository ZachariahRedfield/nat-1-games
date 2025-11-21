import { useCallback } from "react";
import { uid } from "../../../utils.js";

export function useNaturalGroupSaver({
  assets,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setEngine,
  setAssetGroup,
}) {
  return useCallback(
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
}
