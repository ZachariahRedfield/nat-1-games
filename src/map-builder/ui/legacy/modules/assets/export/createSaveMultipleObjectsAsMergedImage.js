import { uid } from "../../utils.js";
import { resolveAssetSource } from "./helpers/assetSourceResolver.js";
import { drawImageWithTransforms, loadImage } from "./helpers/imageRendering.js";
import { promptForName } from "./helpers/namePrompt.js";

export function createSaveMultipleObjectsAsMergedImage({
  assets,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
  setEngine,
}) {
  return async (objectsToSave) => {
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
      const src = resolveAssetSource(asset, obj.variantIndex || 0);
      if (!src) continue;

      const baseImg = await loadImage(src);
      const wObj = Math.max(1, Math.round(obj.wTiles * tileSize));
      const hObj = Math.max(1, Math.round(obj.hTiles * tileSize));
      const cx = Math.round((obj.col - minCol) * tileSize + wObj / 2);
      const cy = Math.round((obj.row - minRow) * tileSize + hObj / 2);
      drawImageWithTransforms(ctx, baseImg, {
        centerX: cx,
        centerY: cy,
        widthPx: wObj,
        heightPx: hObj,
        rotation: obj.rotation || 0,
        flipX: obj.flipX,
        flipY: obj.flipY,
        opacity: obj.opacity ?? 1,
      });
    }

    const dataUrl = canvas.toDataURL("image/png");
    const nameDefault = "Merged Image";
    const name = await promptForName(promptUser, "Name this merged image", nameDefault);
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
  };
}
