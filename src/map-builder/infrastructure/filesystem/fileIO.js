export async function writeFile(dirHandle, pathParts, data) {
  let dir = dirHandle;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    dir = await dir.getDirectoryHandle(pathParts[i], { create: true });
  }
  const filename = pathParts[pathParts.length - 1];
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  if (typeof data === "string") {
    await writable.write(new Blob([data], { type: "application/json" }));
  } else {
    await writable.write(data);
  }
  await writable.close();
}

export async function pickFile(accept) {
  try {
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "Project Bundle", accept: { "*/*": accept } }],
      });
      const file = await handle.getFile();
      return file;
    }
  } catch {
    // ignore and fallback
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,.json,application/zip,application/json";
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}
