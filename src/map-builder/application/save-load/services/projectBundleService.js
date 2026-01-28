import { sanitizeFolderName } from "../../../infrastructure/filesystem/directoryManagement.js";
import { capturePerLayerPNGs } from "../../../infrastructure/canvas/canvasCapture.js";
import { buildProjectStateSnapshot } from "../../../domain/project/projectSerialization.js";
import { exportPack } from "../../../../storage/pack/packExport.ts";
import { importPack } from "../../../../storage/pack/packImport.ts";
import { buildPackEntries, buildSnapshotFromPackEntries } from "../packAdapter.js";

export async function exportBundle(projectState, { canvasRefs, silent = false, mapName } = {}) {
  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  const entries = await buildPackEntries(projectState, layerBlobs);
  const base = sanitizeFolderName(mapName || projectState?.name || projectState?.settings?.name || "mapbuilder-project");
  const content = await exportPack({ name: base, entries });
  const url = URL.createObjectURL(content);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${base}.nat1pack`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  if (!silent) alert("Project pack exported.");
  return true;
}

export async function importBundle(file) {
  const isZip = /\.(zip|nat1pack)$/i.test(file.name) || file.type === "application/zip";
  if (!isZip) {
    const text = await file.text();
    const raw = JSON.parse(text || "{}");
    const snapshot = await buildProjectStateSnapshot(raw, null);
    return snapshot;
  }

  const pack = await importPack(file);
  return buildSnapshotFromPackEntries(pack.entries);
}
