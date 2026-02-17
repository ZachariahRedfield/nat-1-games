export type ProviderKey = "folder" | "opfs" | "indexeddb";

export type FallbackReason = "unsupported" | "permission-lost" | "not-configured";

export type SessionPointer = {
  providerKey: ProviderKey;
  projectId: string;
  locationKey: string;
  epoch: number;
};

export type ModeResolution = {
  preferredMode: ProviderKey | null;
  activeMode: ProviderKey;
  fallbackReason?: FallbackReason;
  requiresUserAction?: { action: "pick-folder" | "grant-permission" };
};
