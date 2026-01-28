import JSZip from "jszip";
import type { PackBundle, PackEntry } from "../StorageProvider";

export const PACK_MANIFEST_PATH = "nat1pack.json";
export const PACK_VERSION = 1;

export type PackExportOptions = {
  name?: string | null;
  entries: PackEntry[];
};

function addEntry(zip: JSZip, entry: PackEntry) {
  if (entry.type === "text" || typeof entry.data === "string") {
    zip.file(entry.path, entry.data);
    return;
  }
  zip.file(entry.path, entry.data);
}

export async function exportPack({ name, entries }: PackExportOptions): Promise<Blob> {
  const zip = new JSZip();
  const manifest: PackBundle["metadata"] = {
    version: PACK_VERSION,
    name: name ?? null,
    createdAt: Date.now(),
  };
  zip.file(PACK_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  for (const entry of entries) {
    addEntry(zip, entry);
  }

  return zip.generateAsync({ type: "blob" });
}
