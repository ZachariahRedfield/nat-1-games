import JSZip from "jszip";
import type { PackBundle, PackEntry } from "../StorageProvider";
import { PACK_MANIFEST_PATH } from "./packExport";

export type PackImportResult = PackBundle;

function isTextPath(path: string) {
  return /\.json$/i.test(path) || /\.txt$/i.test(path) || path === PACK_MANIFEST_PATH;
}

export async function importPack(blob: Blob): Promise<PackImportResult> {
  const zip = await JSZip.loadAsync(blob);
  const entries: PackEntry[] = [];
  const metadataEntry = zip.file(PACK_MANIFEST_PATH);
  let metadata: PackBundle["metadata"] | undefined;
  if (metadataEntry) {
    try {
      const text = await metadataEntry.async("text");
      metadata = JSON.parse(text || "{}");
    } catch {
      metadata = undefined;
    }
  }

  const files = Object.values(zip.files).filter((file) => !file.dir && file.name !== PACK_MANIFEST_PATH);
  for (const file of files) {
    if (isTextPath(file.name)) {
      // eslint-disable-next-line no-await-in-loop
      const text = await file.async("text");
      entries.push({ path: file.name, data: text, type: "text" });
    } else {
      // eslint-disable-next-line no-await-in-loop
      const data = await file.async("blob");
      entries.push({ path: file.name, data, type: "blob" });
    }
  }

  return { entries, metadata };
}
