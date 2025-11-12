import { capturePerLayerPNGs } from "../../../infrastructure/canvas/canvasCapture.js";

export async function prepareProjectStateForSave(projectState, { canvasRefs, mapName } = {}) {
  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  const name = mapName || projectState?.name || projectState?.settings?.name;
  return { layerBlobs, name };
}
