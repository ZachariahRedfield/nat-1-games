import type { StorageAdapter, StorageProvider, StorageProjectListItem } from "../StorageProvider";
import { deleteProjectMetadata, putProjectMetadata } from "../db";
import { exportPack } from "../pack/packExport";
import { importPack } from "../pack/packImport";
import { generateProjectId, layerBlobsFromSnapshot, resolveProjectName } from "../utils";

const PROVIDER_KEY = "opfs";
const PROJECTS_DIR = "nat1-projects";

type StorageSession = {
  getCurrentProjectId: () => string | null;
  setCurrentProjectId: (id: string | null) => void;
  consumeForceNewProject: () => boolean;
};

export class OPFSProvider implements StorageProvider {
  private adapter: StorageAdapter;
  private session: StorageSession;
  private rootHandle: FileSystemDirectoryHandle | null = null;

  constructor(adapter: StorageAdapter, session: StorageSession) {
    this.adapter = adapter;
    this.session = session;
  }

  async init(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) return;
    this.rootHandle = await navigator.storage.getDirectory();
  }

  isSupported(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
  }

  private async ensureProjectsDir(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) {
      throw new Error("OPFS unavailable");
    }
    return this.rootHandle.getDirectoryHandle(PROJECTS_DIR, { create: true });
  }

  async saveProject(
    projectName: string,
    projectState: unknown,
    layerBlobs: Record<string, Blob>
  ) {
    if (!this.rootHandle) {
      return { ok: false, mode: "error", message: "OPFS unavailable" };
    }

    const parent = this.rootHandle;
    const forceNewProject = this.session.consumeForceNewProject();
    const projectId = forceNewProject ? generateProjectId() : this.session.getCurrentProjectId() || generateProjectId();
    const projectsDir = await this.ensureProjectsDir();
    const projectDir = await projectsDir.getDirectoryHandle(projectId, { create: true });

    const stateForFiles = await this.adapter.prepareStateForFileOutput(projectState, projectName, parent);
    await this.adapter.writeProjectFiles(projectDir, stateForFiles, layerBlobs);

    const name = resolveProjectName(projectName, projectState);
    await putProjectMetadata({
      id: projectId,
      name,
      updatedAt: Date.now(),
      provider: PROVIDER_KEY,
      locationKey: projectId,
    });
    this.session.setCurrentProjectId(projectId);
    return { ok: true, mode: "opfs", message: "Project saved locally." };
  }

  async loadProject(projectId: string) {
    if (!this.rootHandle) {
      throw new Error("OPFS unavailable");
    }
    const projectsDir = await this.ensureProjectsDir();
    const projectDir = await projectsDir.getDirectoryHandle(projectId, { create: false });
    const snapshot = await this.adapter.loadProjectSnapshotFromDirectory(projectDir, this.rootHandle);
    this.session.setCurrentProjectId(projectId);
    return snapshot;
  }

  async listProjects(): Promise<StorageProjectListItem[]> {
    if (!this.rootHandle) return [];
    const projectsDir = await this.ensureProjectsDir();
    const results: StorageProjectListItem[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const [name, handle] of projectsDir.entries ? projectsDir.entries() : projectsDir) {
      const isDir = handle.kind === "directory" || handle.getDirectoryHandle;
      if (!isDir) continue;
      const metaFromFile = await this.adapter.readProjectJson(handle);
      if (!metaFromFile) continue;
      const { project, lastModified } = metaFromFile;
      const projectId = name;
      const displayName = resolveProjectName(project?.name, project);
      const updatedAt = lastModified || Date.now();
      await putProjectMetadata({
        id: projectId,
        name: displayName,
        updatedAt,
        provider: PROVIDER_KEY,
        locationKey: projectId,
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
    this.session.setCurrentProjectId(null);
    await this.saveProject(resolveProjectName(undefined, snapshot), snapshot, layerBlobs);
    return { imported: 1, reused: 0 };
  }

  async deleteProject(projectId: string) {
    if (!this.rootHandle) {
      return { ok: false, message: "OPFS unavailable." };
    }
    try {
      const projectsDir = await this.ensureProjectsDir();
      await projectsDir.removeEntry(projectId, { recursive: true });
      await deleteProjectMetadata(projectId);
      if (this.session.getCurrentProjectId() === projectId) {
        this.session.setCurrentProjectId(null);
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Failed to delete map." };
    }
  }
}
