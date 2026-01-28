import type { StorageAdapter, StorageProvider, StorageProjectListItem } from "../StorageProvider";
import {
  deleteProjectData,
  deleteProjectMetadata,
  getProjectData,
  getProjectMetadata,
  listProjectMetadata,
  putProjectData,
  putProjectMetadata,
} from "../db";
import { exportPack } from "../pack/packExport";
import { importPack } from "../pack/packImport";
import { generateProjectId, layerBlobsFromSnapshot, resolveProjectName } from "../utils";

const PROVIDER_KEY = "indexeddb";

type StorageSession = {
  getCurrentProjectId: () => string | null;
  setCurrentProjectId: (id: string | null) => void;
  consumeForceNewProject: () => boolean;
};

export class IndexedDBProvider implements StorageProvider {
  private adapter: StorageAdapter;
  private session: StorageSession;

  constructor(adapter: StorageAdapter, session: StorageSession) {
    this.adapter = adapter;
    this.session = session;
  }

  async init(): Promise<void> {
    return;
  }

  async saveProject(
    projectName: string,
    projectState: unknown,
    layerBlobs: Record<string, Blob>
  ) {
    const forceNewProject = this.session.consumeForceNewProject();
    const projectId = forceNewProject ? generateProjectId() : this.session.getCurrentProjectId() || generateProjectId();
    const entries = await this.adapter.buildPackEntries(projectState, layerBlobs);
    const packBlob = await exportPack({ name: resolveProjectName(projectName, projectState), entries });
    await putProjectData(projectId, packBlob);

    const name = resolveProjectName(projectName, projectState);
    await putProjectMetadata({
      id: projectId,
      name,
      updatedAt: Date.now(),
      provider: PROVIDER_KEY,
      locationKey: projectId,
    });
    this.session.setCurrentProjectId(projectId);
    return { ok: true, mode: "indexeddb", message: "Project saved locally." };
  }

  async loadProject(projectId: string) {
    const blob = await getProjectData(projectId);
    if (!blob) {
      throw new Error("Project not found");
    }
    const pack = await importPack(blob);
    const snapshot = await this.adapter.buildSnapshotFromPackEntries(pack.entries);
    this.session.setCurrentProjectId(projectId);
    return snapshot;
  }

  async listProjects(): Promise<StorageProjectListItem[]> {
    const all = await listProjectMetadata();
    return all
      .filter((record) => record.provider === PROVIDER_KEY)
      .map((record) => ({ id: record.id, name: record.name, updatedAt: record.updatedAt }))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  async exportPack(projectId: string): Promise<Blob> {
    const blob = await getProjectData(projectId);
    if (blob) return blob;
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
    const meta = await getProjectMetadata(projectId);
    if (!meta) {
      return { ok: false, message: "Project not found." };
    }
    await deleteProjectData(projectId);
    await deleteProjectMetadata(projectId);
    if (this.session.getCurrentProjectId() === projectId) {
      this.session.setCurrentProjectId(null);
    }
    return { ok: true };
  }
}
