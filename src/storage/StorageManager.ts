import type {
  StorageAdapter,
  StorageProjectListItem,
  StorageSaveResult,
  StorageProvider,
} from "./StorageProvider";
import { getProjectMetadata, getProjectMetadataByLocation } from "./db";
import { FolderProvider } from "./providers/FolderProvider";
import { OPFSProvider } from "./providers/OPFSProvider";
import { IndexedDBProvider } from "./providers/IndexedDBProvider";

class StorageSession {
  private currentProjectId: string | null = null;
  private forceNewProject = false;

  getCurrentProjectId() {
    return this.currentProjectId;
  }

  setCurrentProjectId(id: string | null) {
    this.currentProjectId = id;
  }

  requestNewProject() {
    this.forceNewProject = true;
  }

  consumeForceNewProject() {
    const value = this.forceNewProject;
    this.forceNewProject = false;
    return value;
  }
}

export class StorageManager {
  private adapter: StorageAdapter;
  private session: StorageSession;
  private providers: StorageProvider[];
  private providerEntries: { key: string; label: string; provider: StorageProvider }[];
  private providerMap: Map<string, StorageProvider>;
  private folderProvider: FolderProvider;
  private opfsProvider: OPFSProvider;
  private indexedDbProvider: IndexedDBProvider;
  private initialized = false;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
    this.session = new StorageSession();
    this.folderProvider = new FolderProvider(adapter, this.session);
    this.opfsProvider = new OPFSProvider(adapter, this.session);
    this.indexedDbProvider = new IndexedDBProvider(adapter, this.session);
    this.providerEntries = [
      { key: "folder", label: "Folder", provider: this.folderProvider },
      { key: "opfs", label: "OPFS", provider: this.opfsProvider },
      { key: "indexeddb", label: "IndexedDB", provider: this.indexedDbProvider },
    ];
    this.providers = this.providerEntries.map((entry) => entry.provider);
    this.providerMap = new Map(this.providerEntries.map((entry) => [entry.key, entry.provider]));
  }

  async init() {
    if (this.initialized) return;
    await Promise.all(this.providers.map((provider) => provider.init()));
    this.initialized = true;
  }

  hasCurrentProject() {
    return Boolean(this.session.getCurrentProjectId() || this.adapter.getCurrentProjectDirectoryHandle());
  }

  clearCurrentProject() {
    this.session.setCurrentProjectId(null);
    this.adapter.clearCurrentProjectDirectory();
  }

  isFolderProviderAvailable() {
    return this.folderProvider.isSupported();
  }

  getCurrentProjectId() {
    return this.session.getCurrentProjectId();
  }

  private async selectDefaultProvider() {
    if (this.folderProvider.isSupported()) return this.folderProvider;
    if (this.opfsProvider.isSupported()) return this.opfsProvider;
    return this.indexedDbProvider;
  }

  private findProviderEntryByKey(key: string | undefined | null) {
    if (!key) return null;
    return this.providerEntries.find((entry) => entry.key === key) || null;
  }

  private findProviderEntryByInstance(provider: StorageProvider) {
    return this.providerEntries.find((entry) => entry.provider === provider) || null;
  }

  async getActiveProviderInfo(): Promise<{ key: string; label: string }> {
    await this.init();
    const currentProjectId = this.session.getCurrentProjectId();
    if (currentProjectId) {
      const meta = await getProjectMetadata(currentProjectId);
      const entry = this.findProviderEntryByKey(meta?.provider);
      if (entry) {
        return { key: entry.key, label: entry.label };
      }
    }

    const currentHandle = this.adapter.getCurrentProjectDirectoryHandle();
    if (currentHandle) {
      const entry = this.findProviderEntryByKey("folder");
      if (entry) {
        return { key: entry.key, label: entry.label };
      }
    }

    const provider = await this.selectDefaultProvider();
    const entry = this.findProviderEntryByInstance(provider) || this.providerEntries[0];
    return { key: entry.key, label: entry.label };
  }

  async getCurrentProjectInfo(): Promise<{ id: string; name: string; providerKey: string } | null> {
    await this.init();
    const currentProjectId = this.session.getCurrentProjectId();
    if (currentProjectId) {
      const meta = await getProjectMetadata(currentProjectId);
      if (meta) {
        return { id: meta.id, name: meta.name, providerKey: meta.provider };
      }
      const provider = await this.selectDefaultProvider();
      const entry = this.findProviderEntryByInstance(provider) || this.providerEntries[0];
      return { id: currentProjectId, name: currentProjectId, providerKey: entry.key };
    }

    const currentHandle = this.adapter.getCurrentProjectDirectoryHandle();
    if (currentHandle) {
      const meta = await getProjectMetadataByLocation("folder", currentHandle.name);
      if (meta) {
        return { id: meta.id, name: meta.name, providerKey: meta.provider };
      }
      return { id: currentHandle.name, name: currentHandle.name, providerKey: "folder" };
    }

    return null;
  }

  private async providerForProjectId(projectId: string): Promise<StorageProvider> {
    const meta = await getProjectMetadata(projectId);
    if (meta?.provider && this.providerMap.has(meta.provider)) {
      return this.providerMap.get(meta.provider) as StorageProvider;
    }
    return this.selectDefaultProvider();
  }

  async saveProject({
    projectName,
    projectState,
    layerBlobs,
    asNew = false,
  }: {
    projectName: string;
    projectState: unknown;
    layerBlobs: Record<string, Blob>;
    asNew?: boolean;
  }): Promise<StorageSaveResult> {
    await this.init();
    if (asNew) {
      this.session.requestNewProject();
      this.clearCurrentProject();
    }
    const provider = await this.selectDefaultProvider();
    return provider.saveProject(projectName, projectState, layerBlobs);
  }

  async saveProjectAs({
    projectName,
    projectState,
    layerBlobs,
  }: {
    projectName: string;
    projectState: unknown;
    layerBlobs: Record<string, Blob>;
  }) {
    return this.saveProject({ projectName, projectState, layerBlobs, asNew: true });
  }

  async loadProject(projectId: string) {
    await this.init();
    const provider = await this.providerForProjectId(projectId);
    return provider.loadProject(projectId);
  }

  async listProjects(): Promise<StorageProjectListItem[]> {
    await this.init();
    const lists = await Promise.all(this.providers.map((provider) => provider.listProjects()));
    const results = lists.flat();
    results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return results;
  }

  async exportPack(projectId: string): Promise<Blob> {
    await this.init();
    const provider = await this.providerForProjectId(projectId);
    return provider.exportPack(projectId);
  }

  async importPack(blob: Blob) {
    await this.init();
    const provider = await this.selectDefaultProvider();
    return provider.importPack(blob);
  }

  async deleteProject(projectId: string) {
    await this.init();
    const provider = await this.providerForProjectId(projectId);
    return provider.deleteProject(projectId);
  }
}
