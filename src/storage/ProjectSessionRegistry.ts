import type { ProviderKey, SessionPointer } from "./storageTypes";

type SessionPublishInput = {
  providerKey: ProviderKey;
  projectId: string;
  locationKey?: string | null;
};

export class ProjectSessionRegistry {
  private pointer: SessionPointer | null = null;
  private forceNewProject = false;
  private epoch = 0;

  getCurrentProjectId() {
    return this.pointer?.projectId || null;
  }

  getPointer() {
    return this.pointer;
  }

  getEpoch() {
    return this.epoch;
  }

  requestNewProject() {
    this.forceNewProject = true;
  }

  consumeForceNewProject() {
    const value = this.forceNewProject;
    this.forceNewProject = false;
    return value;
  }

  clearSession() {
    this.pointer = null;
    this.epoch += 1;
  }

  setCurrentProjectId(projectId: string | null) {
    if (!projectId) {
      this.clearSession();
      return;
    }
    const providerKey = this.pointer?.providerKey || "indexeddb";
    this.publishSession({ providerKey, projectId, locationKey: projectId });
  }

  publishSession({ providerKey, projectId, locationKey }: SessionPublishInput) {
    this.epoch += 1;
    this.pointer = {
      providerKey,
      projectId,
      locationKey: locationKey || projectId,
      epoch: this.epoch,
    };
  }
}
