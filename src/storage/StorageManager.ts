import type { StorageAdapter, StorageProjectListItem, StorageProvider } from "./StorageProvider";
import { getProjectMetadata, getProjectMetadataByLocation } from "./db";
import { ProjectSessionRegistry } from "./ProjectSessionRegistry";
import { SnapshotTransactionService } from "./SnapshotTransactionService";
import { StorageModeOrchestrator } from "./StorageModeOrchestrator";
import { FolderProvider } from "./providers/FolderProvider";
import { OPFSProvider } from "./providers/OPFSProvider";
import { IndexedDBProvider } from "./providers/IndexedDBProvider";
import type { ProviderKey } from "./storageTypes";

export class StorageManager {
  private adapter: StorageAdapter;
  private sessionRegistry: ProjectSessionRegistry;
  private providers: StorageProvider[];
  private orchestrator: StorageModeOrchestrator;
  private transactionService: SnapshotTransactionService;
  private providerEntries: { key: ProviderKey; label: string; provider: StorageProvider }[];
  private providerMap: Map<string, StorageProvider>;
  private folderProvider: FolderProvider;
  private initialized = false;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
    this.sessionRegistry = new ProjectSessionRegistry();
    this.folderProvider = new FolderProvider(adapter, this.sessionRegistry);
    const opfsProvider = new OPFSProvider(adapter, this.sessionRegistry);
    const indexedDbProvider = new IndexedDBProvider(adapter, this.sessionRegistry);

    this.providerEntries = [
      { key: "folder", label: "Folder", provider: this.folderProvider },
      { key: "opfs", label: "OPFS", provider: opfsProvider },
      { key: "indexeddb", label: "IndexedDB", provider: indexedDbProvider },
    ];

    this.providers = this.providerEntries.map((entry) => entry.provider);
    this.providerMap = new Map(this.providerEntries.map((entry) => [entry.key, entry.provider]));
    this.orchestrator = new StorageModeOrchestrator(this.providerEntries);
    this.transactionService = new SnapshotTransactionService({
      orchestrator: this.orchestrator,
      registry: this.sessionRegistry,
      providerMap: this.providerMap,
    });
  }

  async init() {
    if (this.initialized) return;
    await Promise.all(this.providers.map((provider) => provider.init()));
    this.initialized = true;
  }

  hasCurrentProject() {
    return Boolean(this.sessionRegistry.getCurrentProjectId() || this.adapter.getCurrentProjectDirectoryHandle());
  }

  clearCurrentProject() {
    this.sessionRegistry.clearSession();
    this.adapter.clearCurrentProjectDirectory();
  }

  isFolderProviderAvailable() {
    return this.folderProvider.isSupported();
  }

  getCurrentProjectId() {
    return this.sessionRegistry.getCurrentProjectId();
  }

  private findProviderEntryByKey(key: string | undefined | null) {
    if (!key) return null;
    return this.providerEntries.find((entry) => entry.key === key) || null;
  }

  async getActiveProviderInfo(): Promise<{
    key: string;
    label: string;
    preferredKey: string | null;
    preferredLabel: string | null;
    isFallback: boolean;
  }> {
    await this.init();
    const info = this.orchestrator.getActiveProviderInfo();
    return {
      key: info.key,
      label: info.label,
      preferredKey: info.preferredKey,
      preferredLabel: info.preferredLabel,
      isFallback: info.isFallback,
    };
  }

  async getCurrentProjectInfo(): Promise<{
    id: string;
    name: string;
    providerKey: string;
    providerLabel: string | null;
  } | null> {
    await this.init();
    const pointer = this.sessionRegistry.getPointer();
    if (pointer?.projectId) {
      const meta = await getProjectMetadata(pointer.projectId);
      if (meta) {
        const entry = this.findProviderEntryByKey(meta.provider);
        return { id: meta.id, name: meta.name, providerKey: meta.provider, providerLabel: entry?.label || null };
      }
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

  async getProviderOptions() {
    await this.init();
    return this.orchestrator.getProviderOptions();
  }

  async setActiveProvider(providerKey: string) {
    await this.init();
    return this.orchestrator.setActiveProvider(providerKey);
  }

  canChangeLocation(providerKey: string) {
    return providerKey === "folder" && this.folderProvider.isSupported();
  }

  async changeFolderLocation() {
    await this.init();
    if (!this.canChangeLocation("folder")) {
      return { ok: false, message: "Folder storage is unavailable on this device." };
    }
    const result = await this.folderProvider.changeLocation();
    if (!result.ok) return result;

    const pointer = this.sessionRegistry.getPointer();
    if (pointer?.providerKey === "folder") {
      this.sessionRegistry.clearSession();
    }
    this.adapter.clearCurrentProjectDirectory();
    return result;
  }

  async getActiveProviderStatus(): Promise<{ message: string; tone: "warning" | "error" } | null> {
    await this.init();
    const info = this.orchestrator.getActiveProviderInfo();
    if (info.isFallback && info.preferredLabel) {
      return {
        message: `${info.preferredLabel} storage isn't available here. Using ${info.label} instead.`,
        tone: "warning",
      };
    }

    if (info.key !== "folder") return null;
    if (!this.folderProvider.isSupported()) {
      return { message: "Folder storage isn't supported on this device.", tone: "warning" };
    }

    const parent = await this.adapter.getStoredParentDirectoryHandle();
    if (!parent) {
      return { message: "No Account Save Folder configured.", tone: "warning" };
    }

    const ok = await this.adapter.verifyPermission(parent, false);
    if (ok) return null;

    await this.adapter.setStoredParentDirectoryHandle(null);
    this.adapter.clearCurrentProjectDirectory();
    const pointer = this.sessionRegistry.getPointer();
    if (pointer?.providerKey === "folder") {
      this.sessionRegistry.clearSession();
    }
    return { message: "Folder access lost. Choose a folder to continue.", tone: "warning" };
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
  }) {
    await this.init();
    return this.transactionService.save({ projectName, projectState, layerBlobs, asNew });
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
    return this.transactionService.load(projectId);
  }

  async listProjects(): Promise<StorageProjectListItem[]> {
    await this.init();
    return this.transactionService.listProjects(this.providerEntries);
  }

  async exportPack(projectId: string): Promise<Blob> {
    await this.init();
    return this.transactionService.exportPack(projectId);
  }

  async importPack(blob: Blob) {
    await this.init();
    return this.transactionService.importPack(blob);
  }

  async deleteProject(projectId: string) {
    await this.init();
    return this.transactionService.deleteProject(projectId);
  }
}
