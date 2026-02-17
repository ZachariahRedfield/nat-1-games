import { getStoredActiveProviderKey, setStoredActiveProviderKey } from "./providerPreference";
import type { StorageProvider } from "./StorageProvider";
import type { ModeResolution, ProviderKey } from "./storageTypes";

type ProviderEntry = { key: ProviderKey; label: string; provider: StorageProvider };

type ProviderStatus = {
  key: ProviderKey;
  label: string;
  supported: boolean;
  active: boolean;
  canChangeLocation: boolean;
};

export class StorageModeOrchestrator {
  private providerEntries: ProviderEntry[];
  private activeProviderKey: ProviderKey | null;

  constructor(providerEntries: ProviderEntry[]) {
    this.providerEntries = providerEntries;
    this.activeProviderKey = getStoredActiveProviderKey() as ProviderKey | null;
  }

  getProviderEntries() {
    return this.providerEntries;
  }

  private findProviderEntryByKey(key: string | undefined | null) {
    if (!key) return null;
    return this.providerEntries.find((entry) => entry.key === key) || null;
  }

  private isProviderSupported(entry: ProviderEntry) {
    return typeof entry.provider.isSupported === "function" ? entry.provider.isSupported() : true;
  }

  private selectDefaultProviderEntry() {
    return this.providerEntries.find((entry) => this.isProviderSupported(entry)) || this.providerEntries[0];
  }

  resolveMode(): ModeResolution {
    const preferred = this.findProviderEntryByKey(this.activeProviderKey);
    if (preferred && this.isProviderSupported(preferred)) {
      return {
        preferredMode: preferred.key,
        activeMode: preferred.key,
      };
    }
    const active = this.selectDefaultProviderEntry();
    return {
      preferredMode: preferred?.key || null,
      activeMode: active.key,
      fallbackReason: preferred ? "unsupported" : undefined,
    };
  }

  resolveActiveProvider() {
    const resolution = this.resolveMode();
    return this.findProviderEntryByKey(resolution.activeMode) || this.providerEntries[0];
  }

  getProviderOptions(): ProviderStatus[] {
    const active = this.resolveActiveProvider();
    return this.providerEntries.map((entry) => ({
      key: entry.key,
      label: entry.label,
      supported: this.isProviderSupported(entry),
      active: entry.key === active.key,
      canChangeLocation: entry.key === "folder" && this.isProviderSupported(entry),
    }));
  }

  setActiveProvider(providerKey: string) {
    const entry = this.findProviderEntryByKey(providerKey);
    if (!entry) {
      return { ok: false, message: "Unknown storage provider." };
    }
    if (!this.isProviderSupported(entry)) {
      return { ok: false, message: `${entry.label} storage is unavailable on this device.` };
    }
    this.activeProviderKey = entry.key;
    setStoredActiveProviderKey(entry.key);
    return { ok: true, message: `Switched to ${entry.label} storage.` };
  }

  getActiveProviderInfo() {
    const resolution = this.resolveMode();
    const active = this.findProviderEntryByKey(resolution.activeMode) || this.providerEntries[0];
    const preferred = this.findProviderEntryByKey(resolution.preferredMode);
    return {
      key: active.key,
      label: active.label,
      preferredKey: preferred?.key || null,
      preferredLabel: preferred?.label || null,
      isFallback: Boolean(resolution.fallbackReason),
      fallbackReason: resolution.fallbackReason,
    };
  }
}
