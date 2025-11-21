import { useCallback } from "react";
import { uid } from "../../../utils.js";

export function useTokenVariantSaver({
  assets,
  selectedToken,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setEngine,
  setAssetGroup,
}) {
  return useCallback(async () => {
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
}
