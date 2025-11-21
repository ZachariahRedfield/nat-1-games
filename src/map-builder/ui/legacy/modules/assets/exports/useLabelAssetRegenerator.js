import { useCallback } from "react";
import { uid, deepCopyObjects } from "../../../utils.js";

export function useLabelAssetRegenerator({
  assets,
  setAssets,
  setUndoStack,
  setRedoStack,
  updateObjectById,
  selectedObj,
  currentLayer,
  objects,
}) {
  return useCallback(
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
      const size = Math.max(
        8,
        Math.min(128, parseInt(meta?.size ?? asset.labelMeta?.size ?? 28) || 28)
      );
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
}
