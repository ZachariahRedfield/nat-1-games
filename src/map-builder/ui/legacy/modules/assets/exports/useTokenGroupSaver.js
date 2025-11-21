import { useCallback } from "react";
import { uid } from "../../../utils.js";

export function useTokenGroupSaver({
  promptUser,
  setAssets,
  setSelectedAssetId,
  setEngine,
  setAssetGroup,
}) {
  return useCallback(
    async (tokens) => {
      if (!tokens?.length) return;
      const ordered = [...tokens].sort((a, b) => a.col - b.col || a.row - b.row);
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
}
