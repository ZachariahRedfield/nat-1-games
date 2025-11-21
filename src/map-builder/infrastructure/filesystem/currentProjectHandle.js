let currentProjectDirHandleMem = null;

export function getCurrentProjectDirectoryHandle() {
  return currentProjectDirHandleMem;
}

export function setCurrentProjectDirectoryHandle(handle) {
  currentProjectDirHandleMem = handle || null;
}

export function hasCurrentProjectDirectory() {
  return Boolean(currentProjectDirHandleMem);
}

export function clearCurrentProjectDirectory() {
  currentProjectDirHandleMem = null;
}
