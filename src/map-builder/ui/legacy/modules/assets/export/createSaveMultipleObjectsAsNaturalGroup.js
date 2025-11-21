import { uid } from "../../utils.js";
import { resolveAssetSource } from "./helpers/assetSourceResolver.js";
import { renderToDataUrl } from "./helpers/imageRendering.js";
import { promptForName } from "./helpers/namePrompt.js";

export function createSaveMultipleObjectsAsNaturalGroup({
  assets,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
  setEngine,
}) {
  return async (objectsToSave) => {
    const variants = [];
    for (const obj of objectsToSave || []) {
      const asset = assets.find((item) => item.id === obj.assetId);
      const src = resolveAssetSource(asset, obj.variantIndex || 0);
      if (!src) continue;

      const wPx = Math.max(1, Math.round(obj.wTiles * tileSize));
      const hPx = Math.max(1, Math.round(obj.hTiles * tileSize));
      const dataUrl = await renderToDataUrl({
        src,
        widthPx: wPx,
        heightPx: hPx,
        rotation: obj.rotation || 0,
        flipX: obj.flipX,
        flipY: obj.flipY,
        opacity: obj.opacity ?? 1,
      });
      variants.push({ src: dataUrl, aspectRatio: wPx / hPx || 1 });
    }

    if (!variants.length) return;
    const nameDefault = "Natural Group";
    const name = await promptForName(promptUser, "Name this Natural group", nameDefault);
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
  };
}
