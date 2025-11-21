import { useCallback } from "react";
import { uid } from "../../../utils.js";

export function useMergedImageSaver({
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
}
