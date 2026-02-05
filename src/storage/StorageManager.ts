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
import { getStoredActiveProviderKey, setStoredActiveProviderKey } from "./providerPreference";

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
  private activeProviderKey: string | null = null;
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
    this.activeProviderKey = getStoredActiveProviderKey();
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

  private isProviderEntrySupported(entry: { provider: StorageProvider }) {
    return typeof entry.provider.isSupported === "function" ? entry.provider.isSupported() : true;
  }

  private resolvePreferredProviderEntry() {
    const preferred = this.findProviderEntryByKey(this.activeProviderKey);
    if (preferred && this.isProviderEntrySupported(preferred)) {
      return preferred;
    }
    return null;
  }

  private async resolveActiveProviderEntry() {
    const preferred = this.findProviderEntryByKey(this.activeProviderKey);
    if (preferred && this.isProviderEntrySupported(preferred)) {
      return { entry: preferred, preferred, isFallback: false };
    }
    const provider = await this.selectDefaultProvider();
    const entry = this.findProviderEntryByInstance(provider) || this.providerEntries[0];
    return { entry, preferred, isFallback: Boolean(preferred) };
  }

  async getActiveProviderInfo(): Promise<{
    key: string;
    label: string;
    preferredKey: string | null;
    preferredLabel: string | null;
    isFallback: boolean;
  }> {
    await this.init();
    const { entry, preferred, isFallback } = await this.resolveActiveProviderEntry();
    return {
      key: entry.key,
      label: entry.label,
      preferredKey: preferred?.key || null,
      preferredLabel: preferred?.label || null,
      isFallback,
    };
  }

  async getCurrentProjectInfo(): Promise<{
    id: string;
    name: string;
    providerKey: string;
    providerLabel: string | null;
  } | null> {
    await this.init();
    const currentProjectId = this.session.getCurrentProjectId();
    if (currentProjectId) {
      const meta = await getProjectMetadata(currentProjectId);
      if (meta) {
        const entry = this.findProviderEntryByKey(meta.provider);
        return { id: meta.id, name: meta.name, providerKey: meta.provider, providerLabel: entry?.label || null };
      }
      const provider = await this.selectDefaultProvider();
      const entry = this.findProviderEntryByInstance(provider) || this.providerEntries[0];
      return { id: currentProjectId, name: currentProjectId, providerKey: entry.key, providerLabel: entry.label };
    }

    const currentHandle = this.adapter.getCurrentProjectDirectoryHandle();
    if (currentHandle) {
      const meta = await getProjectMetadataByLocation("folder", currentHandle.name);
      if (meta) {
        const entry = this.findProviderEntryByKey(meta.provider);
        return { id: meta.id, name: meta.name, providerKey: meta.provider, providerLabel: entry?.label || null };
      }
      const entry = this.findProviderEntryByKey("folder");
      return {
        id: currentHandle.name,
        name: currentHandle.name,
        providerKey: "folder",
        providerLabel: entry?.label || null,
      };
    }

    return null;
  }

  async getProviderOptions(): Promise<
    { key: string; label: string; supported: boolean; active: boolean; canChangeLocation: boolean }[]
  > {
    await this.init();
    const { entry } = await this.resolveActiveProviderEntry();
    return this.providerEntries.map((providerEntry) => ({
      key: providerEntry.key,
      label: providerEntry.label,
      supported: this.isProviderEntrySupported(providerEntry),
      active: providerEntry.key === entry.key,
      canChangeLocation: providerEntry.key === "folder" && this.isProviderEntrySupported(providerEntry),
    }));
  }

  async setActiveProvider(providerKey: string) {
    await this.init();
    const entry = this.findProviderEntryByKey(providerKey);
    if (!entry) {
      return { ok: false, message: "Unknown storage provider." };
    }
    if (!this.isProviderEntrySupported(entry)) {
      return { ok: false, message: `${entry.label} storage is unavailable on this device.` };
    }
    this.activeProviderKey = entry.key;
    setStoredActiveProviderKey(entry.key);
    return { ok: true, message: `Switched to ${entry.label} storage.` };
  }

  canChangeLocation(providerKey: string) {
    const entry = this.findProviderEntryByKey(providerKey);
    if (!entry) return false;
    return providerKey === "folder" && this.isProviderEntrySupported(entry);
  }

  async changeFolderLocation() {
    await this.init();
    if (!this.canChangeLocation("folder")) {
      return { ok: false, message: "Folder storage is unavailable on this device." };
    }
    const result = await this.folderProvider.changeLocation();
    if (result.ok) {
      const currentProjectId = this.session.getCurrentProjectId();
      if (currentProjectId) {
        const meta = await getProjectMetadata(currentProjectId);
        if (meta?.provider === "folder") {
          this.session.setCurrentProjectId(null);
        }
      }
    }
    return result;
  }

  async getActiveProviderStatus(): Promise<{ message: string; tone: "warning" | "error" } | null> {
    await this.init();
    const { entry, preferred, isFallback } = await this.resolveActiveProviderEntry();
    if (isFallback && preferred && !this.isProviderEntrySupported(preferred)) {
      return {
        message: `${preferred.label} storage isn't available here. Using ${entry.label} instead.`,
        tone: "warning",
      };
    }
    if (entry.key !== "folder") return null;
    if (!this.folderProvider.isSupported()) {
      return { message: "Folder storage isn't supported on this device.", tone: "warning" };
    }
    const parent = await this.adapter.getStoredParentDirectoryHandle();
    if (!parent) {
      return { message: "No Account Save Folder configured.", tone: "warning" };
    }
    const ok = await this.adapter.verifyPermission(parent, false);
    if (!ok) {
      await this.adapter.setStoredParentDirectoryHandle(null);
      this.adapter.clearCurrentProjectDirectory();
      const currentProjectId = this.session.getCurrentProjectId();
      if (currentProjectId) {
        const meta = await getProjectMetadata(currentProjectId);
        if (meta?.provider === "folder") {
          this.session.setCurrentProjectId(null);
        }
      }
      return { message: "Folder access lost. Choose a folder to continue.", tone: "warning" };
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
    let provider: StorageProvider;
    if (!asNew) {
      const currentProjectId = this.session.getCurrentProjectId();
      if (currentProjectId) {
        provider = await this.providerForProjectId(currentProjectId);
      } else if (this.adapter.getCurrentProjectDirectoryHandle()) {
        provider = this.folderProvider;
      } else {
        const preferredEntry = this.resolvePreferredProviderEntry();
        provider = preferredEntry ? preferredEntry.provider : await this.selectDefaultProvider();
      }
    } else {
      const preferredEntry = this.resolvePreferredProviderEntry();
      provider = preferredEntry ? preferredEntry.provider : await this.selectDefaultProvider();
    }
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
    const lists = await Promise.all(
      this.providerEntries.map(async (providerEntry) => {
        const items = await providerEntry.provider.listProjects();
        return items.map((item) => ({
          ...item,
          providerKey: providerEntry.key,
          providerLabel: providerEntry.label,
        }));
      })
    );
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
    const preferredEntry = this.resolvePreferredProviderEntry();
    const provider = preferredEntry ? preferredEntry.provider : await this.selectDefaultProvider();
    return provider.importPack(blob);
  }

  async deleteProject(projectId: string) {
    await this.init();
    const provider = await this.providerForProjectId(projectId);
    return provider.deleteProject(projectId);
  }
}
