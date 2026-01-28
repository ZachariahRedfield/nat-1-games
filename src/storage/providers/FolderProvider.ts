import type { StorageAdapter, StorageProvider, StorageProjectListItem } from "../StorageProvider";
import {
  deleteProjectMetadata,
  getProjectMetadata,
  getProjectMetadataByLocation,
  putProjectMetadata,
} from "../db";
import { exportPack } from "../pack/packExport";
import { importPack } from "../pack/packImport";
import { generateProjectId, layerBlobsFromSnapshot, resolveProjectName } from "../utils";

const PROVIDER_KEY = "folder";

type StorageSession = {
  getCurrentProjectId: () => string | null;
  setCurrentProjectId: (id: string | null) => void;
  consumeForceNewProject: () => boolean;
};

export class FolderProvider implements StorageProvider {
  private adapter: StorageAdapter;
  private session: StorageSession;

  constructor(adapter: StorageAdapter, session: StorageSession) {
    this.adapter = adapter;
    this.session = session;
  }

  async init(): Promise<void> {
    return;
  }

  isSupported(): boolean {
    return this.adapter.hasFileSystemAccess();
  }

  async saveProject(
    projectName: string,
    projectState: unknown,
    layerBlobs: Record<string, Blob>
  ) {
    const parent = await this.adapter.getStoredParentDirectoryHandle();
    const parentOk = parent ? await this.adapter.verifyPermission(parent, true) : false;
    if (!parentOk || !parent) {
      return { ok: false, mode: "error", code: "NO_PARENT", message: "No Account Save Folder configured." };
    }

    const forceNewProject = this.session.consumeForceNewProject();
    let projectDirHandle = forceNewProject ? null : this.adapter.getCurrentProjectDirectoryHandle();
    let projectOk = projectDirHandle ? await this.adapter.verifyPermission(projectDirHandle, true) : false;
    if (!projectOk || !projectDirHandle) {
      const folderName = this.adapter.sanitizeFolderName(projectName || "Map");
      const mapsDir = await this.adapter.ensureMapsDir(parent);
      if (forceNewProject) {
        const created = await this.adapter.createUniqueMapDir(mapsDir, folderName);
        projectDirHandle = created.handle;
      } else {
        projectDirHandle = await mapsDir.getDirectoryHandle(folderName, { create: true });
      }
      projectOk = await this.adapter.verifyPermission(projectDirHandle, true);
      if (projectOk) {
        this.adapter.setCurrentProjectDirectoryHandle(projectDirHandle);
      }
    }

    if (!projectOk || !projectDirHandle) {
      return { ok: false, mode: "error", message: "Permission denied" };
    }

    const stateForFiles = await this.adapter.prepareStateForFileOutput(projectState, projectName, parent);
    await this.adapter.writeProjectFiles(projectDirHandle, stateForFiles, layerBlobs);

    const locationKey = projectDirHandle.name;
    const existing = await getProjectMetadataByLocation(PROVIDER_KEY, locationKey);
    const projectId = existing?.id || this.session.getCurrentProjectId() || generateProjectId();
    const name = resolveProjectName(projectName, projectState);
    await putProjectMetadata({
      id: projectId,
      name,
      updatedAt: Date.now(),
      provider: PROVIDER_KEY,
      locationKey,
    });
    this.session.setCurrentProjectId(projectId);
    return { ok: true, mode: "fs", message: "Project saved to folder." };
  }

  async loadProject(projectId: string) {
    const meta = await getProjectMetadata(projectId);
    if (!meta?.locationKey) {
      throw new Error("Project not found");
    }

    const parent = await this.adapter.getStoredParentDirectoryHandle();
    const parentOk = parent ? await this.adapter.verifyPermission(parent, true) : false;
    if (!parentOk || !parent) {
      throw new Error("Permission denied");
    }

    const mapsDir = await this.adapter.ensureMapsDir(parent);
    const dirHandle = await mapsDir.getDirectoryHandle(meta.locationKey, { create: false });
    const ok = await this.adapter.verifyPermission(dirHandle, true);
    if (!ok) {
      throw new Error("Permission denied");
    }

    const snapshot = await this.adapter.loadProjectSnapshotFromDirectory(dirHandle, parent);
    this.adapter.setCurrentProjectDirectoryHandle(dirHandle);
    this.session.setCurrentProjectId(projectId);
    return snapshot;
  }

  async listProjects(): Promise<StorageProjectListItem[]> {
    const parent = await this.adapter.getStoredParentDirectoryHandle();
    const parentOk = parent ? await this.adapter.verifyPermission(parent, false) : false;
    if (!parentOk || !parent) return [];

    const results: StorageProjectListItem[] = [];
    const mapsDir = await this.adapter.ensureMapsDir(parent);
    // eslint-disable-next-line no-restricted-syntax
    for await (const [name, handle] of mapsDir.entries ? mapsDir.entries() : mapsDir) {
      const isDir = handle.kind === "directory" || handle.getDirectoryHandle;
      if (!isDir) continue;
      const metaFromFile = await this.adapter.readProjectJson(handle);
      if (!metaFromFile) continue;
      const { project, lastModified } = metaFromFile;
      const locationKey = name;
      const existing = await getProjectMetadataByLocation(PROVIDER_KEY, locationKey);
      const projectId = existing?.id || generateProjectId();
      const displayName = resolveProjectName(project?.name, project);
      const updatedAt = lastModified || Date.now();
      await putProjectMetadata({
        id: projectId,
        name: displayName,
        updatedAt,
        provider: PROVIDER_KEY,
        locationKey,
      });
      results.push({ id: projectId, name: displayName, updatedAt });
    }

    results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return results;
  }

  async exportPack(projectId: string): Promise<Blob> {
    const snapshot = await this.loadProject(projectId);
    const layerBlobs = await layerBlobsFromSnapshot(snapshot);
    const entries = await this.adapter.buildPackEntries(snapshot, layerBlobs);
    return exportPack({ name: resolveProjectName(undefined, snapshot), entries });
  }

  async importPack(blob: Blob) {
    const pack = await importPack(blob);
    const snapshot = await this.adapter.buildSnapshotFromPackEntries(pack.entries);
    const layerBlobs = await layerBlobsFromSnapshot(snapshot);
    this.adapter.clearCurrentProjectDirectory();
    this.session.setCurrentProjectId(null);
    await this.saveProject(resolveProjectName(undefined, snapshot), snapshot, layerBlobs);
    return { imported: 1, reused: 0 };
  }

  async deleteProject(projectId: string) {
    const meta = await getProjectMetadata(projectId);
    if (!meta?.locationKey) {
      return { ok: false, message: "Project not found." };
    }
    const parent = await this.adapter.getStoredParentDirectoryHandle();
    const parentOk = parent ? await this.adapter.verifyPermission(parent, true) : false;
    if (!parentOk || !parent) {
      return { ok: false, message: "No Account Save Folder configured." };
    }
    try {
      const mapsDir = await this.adapter.ensureMapsDir(parent);
      await mapsDir.removeEntry(meta.locationKey, { recursive: true });
      await deleteProjectMetadata(projectId);
      const currentHandle = this.adapter.getCurrentProjectDirectoryHandle();
      if (currentHandle && currentHandle.name === meta.locationKey) {
        this.adapter.clearCurrentProjectDirectory();
        this.session.setCurrentProjectId(null);
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Failed to delete map." };
    }
  }
}
