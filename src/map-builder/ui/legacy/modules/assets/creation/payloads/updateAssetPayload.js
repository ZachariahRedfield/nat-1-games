import { deriveUpdateBase } from "./common/deriveUpdateBase.js";
import { updatePayloadBuilders } from "./payloadRegistry.js";

export async function updateAssetPayload({ tab, state, initialAsset, selectedImageSrc }) {
  if (!initialAsset) return null;

  const builder = updatePayloadBuilders[tab];
  if (!builder) return null;

  const base = deriveUpdateBase(initialAsset, state);
  return builder({ base, state, selectedImageSrc });
}
