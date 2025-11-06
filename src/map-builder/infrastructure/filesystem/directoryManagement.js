import { ASSETS_DIR_NAME, MAPS_DIR_NAME } from "../persistence/persistenceKeys.js";

export async function ensureAssetsDir(parentHandle) {
  const dir = await parentHandle.getDirectoryHandle(ASSETS_DIR_NAME, { create: true });
  return dir;
}

export async function ensureMapsDir(parentHandle) {
  const dir = await parentHandle.getDirectoryHandle(MAPS_DIR_NAME, { create: true });
  return dir;
}

export async function createUniqueMapDir(mapsDirHandle, baseName) {
  const base = sanitizeFolderName(baseName || "Map");
  let name = base;
  let idx = 2;
  while (true) {
    try {
      await mapsDirHandle.getDirectoryHandle(name, { create: false });
      name = `${base} (${idx++})`;
    } catch {
      const handle = await mapsDirHandle.getDirectoryHandle(name, { create: true });
      return { handle, name };
    }
  }
}

export function sanitizeFolderName(name) {
  const fallback = "Map";
  if (!name || typeof name !== "string") return fallback;
  let sanitized = name.trim();
  if (!sanitized) return fallback;
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim();
  const reserved = new Set([
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ]);
  if (reserved.has(sanitized.toUpperCase())) sanitized = `${sanitized}-map`;
  sanitized = sanitized.replace(/[\.\s]+$/g, "");
  return sanitized || fallback;
}
