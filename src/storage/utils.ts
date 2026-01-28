export function generateProjectId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function resolveProjectName(projectName: string | undefined, projectState: any): string {
  return (
    projectName ||
    projectState?.name ||
    projectState?.settings?.name ||
    "Map"
  );
}

export async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function layerBlobsFromSnapshot(snapshot: any): Promise<Record<string, Blob>> {
  if (!snapshot) return {};
  if (snapshot.canvases && typeof snapshot.canvases === "object") {
    const entries = Object.entries(snapshot.canvases);
    const output: Record<string, Blob> = {};
    for (const [layerId, dataUrl] of entries) {
      if (!dataUrl) continue;
      // eslint-disable-next-line no-await-in-loop
      output[layerId] = await blobFromDataUrl(dataUrl);
    }
    return output;
  }
  if (snapshot.canvasDataUrl) {
    return { base: await blobFromDataUrl(snapshot.canvasDataUrl) };
  }
  return {};
}
