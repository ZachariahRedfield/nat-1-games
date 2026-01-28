import { StorageManager } from "../../../storage/StorageManager.ts";
import { createMapBuilderStorageAdapter } from "./storageAdapter.js";

const storageManager = new StorageManager(createMapBuilderStorageAdapter());

export function getStorageManager() {
  return storageManager;
}
