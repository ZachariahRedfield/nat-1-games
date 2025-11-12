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

  if (layerBlobs.background) {
    await writeFile(projectDirHandle, ["canvas-background.png"], layerBlobs.background);
  }
  if (layerBlobs.base) {
    await writeFile(projectDirHandle, ["canvas-base.png"], layerBlobs.base);
  }
  if (layerBlobs.sky) {
    await writeFile(projectDirHandle, ["canvas-sky.png"], layerBlobs.sky);
  }
}
