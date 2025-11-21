import { uid } from "../../utils.js";
import { resolveAssetSource } from "./helpers/assetSourceResolver.js";
import { renderToDataUrl } from "./helpers/imageRendering.js";
import { promptForName } from "./helpers/namePrompt.js";

export function createSaveSelectionAsAsset({
  assets,
  selectedObj,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
  setEngine,
}) {
  return async () => {
    if (!selectedObj) return;
    const asset = assets.find((item) => item.id === selectedObj.assetId);
    if (!asset) return;

    const src = resolveAssetSource(asset, selectedObj.variantIndex || 0);
    if (!src) return;

    const wPx = Math.max(1, Math.round(selectedObj.wTiles * tileSize));
    const hPx = Math.max(1, Math.round(selectedObj.hTiles * tileSize));
    const dataUrl = await renderToDataUrl({
      src,
      widthPx: wPx,
      heightPx: hPx,
      rotation: selectedObj.rotation || 0,
      flipX: selectedObj.flipX,
      flipY: selectedObj.flipY,
      opacity: selectedObj.opacity ?? 1,
    });
    const nameDefault = `${asset.name}-variant`;
    const name = await promptForName(promptUser, "Name this saved asset", nameDefault);
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
    if (asset.kind === "natural") {
      setAssetGroup?.("image");
    }
  };
}
