export const SETTINGS_FILE_SUFFIX = ".settings.json";

export function sanitizeSettingsId(id) {
  const normalized = String(id ?? "");
  const cleaned = normalized.replace(/[^a-z0-9_-]/gi, "_");
  return cleaned || "asset";
}

export function settingsFilenameForId(id) {
  return `${sanitizeSettingsId(id)}${SETTINGS_FILE_SUFFIX}`;
}
