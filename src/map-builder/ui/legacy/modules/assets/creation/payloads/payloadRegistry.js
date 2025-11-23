import { createImageAssetPayload, updateImageAssetPayload } from "./imageAssetPayload.js";
import { createTokenAssetPayload, updateTokenAssetPayload } from "./tokenAssetPayload.js";
import { createTextAssetPayload, updateTextAssetPayload } from "./textAssetPayload.js";
import { createMaterialAssetPayload, updateMaterialAssetPayload } from "./materialAssetPayload.js";
import { createNaturalAssetPayload, updateNaturalAssetPayload } from "./naturalAssetPayload.js";

export const createPayloadBuilders = {
  image: createImageAssetPayload,
  token: createTokenAssetPayload,
  text: createTextAssetPayload,
  material: createMaterialAssetPayload,
  natural: createNaturalAssetPayload,
};

export const updatePayloadBuilders = {
  image: updateImageAssetPayload,
  token: updateTokenAssetPayload,
  text: updateTextAssetPayload,
  material: updateMaterialAssetPayload,
  natural: updateNaturalAssetPayload,
};
