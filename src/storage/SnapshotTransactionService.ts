import { getProjectMetadata, getProjectMetadataByLocation } from "./db";
import type {
  StorageImportResult,
  StorageProjectListItem,
  StorageProvider,
  StorageSaveResult,
} from "./StorageProvider";
import type { StorageModeOrchestrator } from "./StorageModeOrchestrator";
import type { ProjectSessionRegistry } from "./ProjectSessionRegistry";
import type { ProviderKey } from "./storageTypes";

type ProviderMap = Map<string, StorageProvider>;

type SaveCommand = {
  projectName: string;
  projectState: unknown;
  layerBlobs: Record<string, Blob>;
  asNew?: boolean;
};

export class SnapshotTransactionService {
  private orchestrator: StorageModeOrchestrator;
  private registry: ProjectSessionRegistry;
  private providerMap: ProviderMap;

  constructor({
    orchestrator,
    registry,
    providerMap,
  }: {
    orchestrator: StorageModeOrchestrator;
    registry: ProjectSessionRegistry;
    providerMap: ProviderMap;
  }) {
    this.orchestrator = orchestrator;
    this.registry = registry;
    this.providerMap = providerMap;
  }

  private async providerForProjectId(projectId: string): Promise<{ key: ProviderKey; provider: StorageProvider }> {
    const meta = await getProjectMetadata(projectId);
    if (meta?.provider && this.providerMap.has(meta.provider)) {
      return { key: meta.provider as ProviderKey, provider: this.providerMap.get(meta.provider) as StorageProvider };
    }
    const active = this.orchestrator.resolveActiveProvider();
    return { key: active.key, provider: active.provider };
  }

  private async publishSessionForProject(projectId: string, providerKey: ProviderKey) {
    const meta = await getProjectMetadata(projectId);
    this.registry.publishSession({
      providerKey,
      projectId,
      locationKey: meta?.locationKey || projectId,
    });
  }

  async save(input: SaveCommand): Promise<StorageSaveResult> {
    const { projectName, projectState, layerBlobs, asNew = false } = input;
    const startingEpoch = this.registry.getEpoch();

    if (asNew) {
      this.registry.requestNewProject();
      this.registry.clearSession();
    }

    const currentProjectId = this.registry.getCurrentProjectId();
    const active = this.orchestrator.resolveActiveProvider();
    const providerEntry = !asNew && currentProjectId
      ? await this.providerForProjectId(currentProjectId)
      : { key: active.key, provider: active.provider };

    const result = await providerEntry.provider.saveProject(projectName, projectState, layerBlobs);
    if (!result.ok) {
      return result;
    }

    const savedProjectId = this.registry.getCurrentProjectId() || currentProjectId;
    if (!savedProjectId) return result;

    if (this.registry.getEpoch() < startingEpoch) {
      return result;
    }

    await this.publishSessionForProject(savedProjectId, providerEntry.key);
    return result;
  }

  async load(projectId: string) {
    const providerEntry = await this.providerForProjectId(projectId);
    const snapshot = await providerEntry.provider.loadProject(projectId);
    await this.publishSessionForProject(projectId, providerEntry.key);
    return snapshot;
  }

  async importPack(blob: Blob): Promise<StorageImportResult> {
    const active = this.orchestrator.resolveActiveProvider();
    const result = await active.provider.importPack(blob);
    const projectId = this.registry.getCurrentProjectId();
    if (projectId) {
      await this.publishSessionForProject(projectId, active.key);
    }
    return result;
  }

  async deleteProject(projectId: string) {
    const providerEntry = await this.providerForProjectId(projectId);
    const result = await providerEntry.provider.deleteProject(projectId);
    if (result.ok && this.registry.getCurrentProjectId() === projectId) {
      this.registry.clearSession();
    }
    return result;
  }

  async exportPack(projectId: string): Promise<Blob> {
    const providerEntry = await this.providerForProjectId(projectId);
    return providerEntry.provider.exportPack(projectId);
  }

  async listProjects(providerEntries: { key: ProviderKey; label: string; provider: StorageProvider }[]) {
    const lists = await Promise.all(
      providerEntries.map(async (providerEntry) => {
        const items = await providerEntry.provider.listProjects();
        return items.map((item: StorageProjectListItem) => ({
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

  async refreshSessionFromFolderLocation(locationKey: string) {
    const meta = await getProjectMetadataByLocation("folder", locationKey);
    if (!meta) {
      this.registry.clearSession();
      return;
    }
    this.registry.publishSession({ providerKey: "folder", projectId: meta.id, locationKey: meta.locationKey });
  }
}
