import { deriveAssetName } from "./common/deriveAssetName.js";
import { createPayloadBuilders } from "./payloadRegistry.js";

export async function createAssetPayload({ tab, state, selectedImageSrc }) {
  const builder = createPayloadBuilders[tab];
  if (!builder) return null;

  const name = deriveAssetName(tab, state);
  return builder({ name, state, selectedImageSrc });
}
