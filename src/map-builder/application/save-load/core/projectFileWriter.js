import { writeFile } from "../../../infrastructure/filesystem/fileIO.js";
import {
  toObjectsJson,
  toProjectJson,
  toTilesJson,
  toTokensJson,
} from "../../../domain/project/projectSerialization.js";

async function writeJsonFile(projectDirHandle, pathSegments, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  await writeFile(projectDirHandle, pathSegments, blob);
}

export async function writeProjectFiles(projectDirHandle, projectState, layerBlobs) {
  const projectJson = toProjectJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tokensJson = toTokensJson(projectState);
  const tilesJson = toTilesJson(projectState);

  await writeJsonFile(projectDirHandle, ["project.json"], projectJson);
  await writeJsonFile(projectDirHandle, ["tiles.json"], tilesJson);
  await writeJsonFile(projectDirHandle, ["objects.json"], objectsJson);
  await writeJsonFile(projectDirHandle, ["tokens.json"], tokensJson);

  const entries = Object.entries(layerBlobs || {});
  let ordinal = 0;
  for (const [layerId, blob] of entries) {
    if (!blob) continue;
    const safeId = (layerId || `layer-${ordinal}`).replace(/[^a-z0-9_-]/gi, "_");
    if (layerId === "background" || layerId === "base" || layerId === "sky") {
      await writeFile(projectDirHandle, [`canvas-${layerId}.png`], blob);
    }
    const index = String(ordinal).padStart(2, "0");
    await writeFile(projectDirHandle, ["canvases", `${index}-${safeId}.png`], blob);
    ordinal += 1;
  }
}
