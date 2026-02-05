export type StorageProjectListItem = {
  id: string;
  name: string;
  updatedAt: number;
  providerKey?: string;
  providerLabel?: string;
};

export type StorageSaveResult = {
  ok: boolean;
  mode: string;
  message: string;
  code?: string;
};

export type StorageImportResult = {
  imported: number;
  reused: number;
};

export interface StorageProvider {
  isSupported?: () => boolean;
  init(): Promise<void>;
  saveProject(
    projectName: string,
    projectState: unknown,
    layerBlobs: Record<string, Blob>
  ): Promise<StorageSaveResult>;
  loadProject(projectId: string): Promise<unknown>;
  listProjects(): Promise<StorageProjectListItem[]>;
  exportPack(projectId: string): Promise<Blob>;
  importPack(blob: Blob): Promise<StorageImportResult>;
  deleteProject(projectId: string): Promise<{ ok: boolean; message?: string }>;
}

export type StorageMetadataRecord = {
  id: string;
  name: string;
  updatedAt: number;
  provider: string;
  locationKey?: string;
};

export type PackEntry = {
  path: string;
  data: string | Blob;
  type?: "text" | "blob";
};

export type PackBundle = {
  entries: PackEntry[];
  metadata?: { version: number; name?: string | null; createdAt?: number };
};

export type StorageAdapter = {
  hasFileSystemAccess: () => boolean;
  verifyPermission: (handle: FileSystemHandle, readWrite: boolean) => Promise<boolean>;
  requestParentDirectoryHandle: (
    startIn?: FileSystemDirectoryHandle | null
  ) => Promise<FileSystemDirectoryHandle | null>;
  getStoredParentDirectoryHandle: () => Promise<FileSystemDirectoryHandle | null>;
  setStoredParentDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => Promise<void>;
  getCurrentProjectDirectoryHandle: () => FileSystemDirectoryHandle | null;
  setCurrentProjectDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void;
  clearCurrentProjectDirectory: () => void;
  ensureMapsDir: (parentHandle: FileSystemDirectoryHandle) => Promise<FileSystemDirectoryHandle>;
  createUniqueMapDir: (
    mapsDirHandle: FileSystemDirectoryHandle,
    baseName: string
  ) => Promise<{ handle: FileSystemDirectoryHandle; name: string }>;
  sanitizeFolderName: (name: string) => string;
  prepareStateForFileOutput: (
    projectState: unknown,
    name: string | undefined,
    parentHandle: FileSystemDirectoryHandle
  ) => Promise<unknown>;
  writeProjectFiles: (
    projectDirHandle: FileSystemDirectoryHandle,
    projectState: unknown,
    layerBlobs: Record<string, Blob>
  ) => Promise<void>;
  loadProjectSnapshotFromDirectory: (
    dirHandle: FileSystemDirectoryHandle,
    parentHandle: FileSystemDirectoryHandle
  ) => Promise<unknown>;
  readProjectJson: (
    dirHandle: FileSystemDirectoryHandle
  ) => Promise<{ project: any; lastModified: number } | null>;
  buildPackEntries: (
    projectState: unknown,
    layerBlobs: Record<string, Blob> | null
  ) => Promise<PackEntry[]>;
  buildSnapshotFromPackEntries: (entries: PackEntry[]) => Promise<unknown>;
};
