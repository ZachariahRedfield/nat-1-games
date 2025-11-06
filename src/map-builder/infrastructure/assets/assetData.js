export async function blobFromSrc(src) {
  if (!src) return null;
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return blob;
  } catch {
    return null;
  }
}
