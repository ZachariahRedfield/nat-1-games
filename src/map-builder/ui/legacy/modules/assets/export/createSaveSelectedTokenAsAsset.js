import { uid } from "../../utils.js";
import { renderToDataUrl } from "./helpers/imageRendering.js";
import { promptForName } from "./helpers/namePrompt.js";

export function createSaveSelectedTokenAsAsset({
  assets,
  selectedToken,
  tileSize,
  promptUser,
  setAssets,
  setSelectedAssetId,
  setAssetGroup,
  setEngine,
}) {
  return async () => {
    if (!selectedToken) return;
    const asset = assets.find((item) => item.id === selectedToken.assetId);
    if (!asset) return;

    const wPx = Math.max(1, Math.round((selectedToken.wTiles || 1) * tileSize));
    const hPx = Math.max(1, Math.round((selectedToken.hTiles || 1) * tileSize));
    const dataUrl = await renderToDataUrl({
      src: asset.src,
      widthPx: wPx,
      heightPx: hPx,
      rotation: selectedToken.rotation || 0,
      flipX: selectedToken.flipX,
      flipY: selectedToken.flipY,
      opacity: selectedToken.opacity ?? 1,
    });
    const nameDefault = `${asset.name}-variant`;
    const name = await promptForName(promptUser, "Name this saved token", nameDefault);
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
}
