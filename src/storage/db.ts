import type { StorageMetadataRecord } from "./StorageProvider";

const DB_NAME = "nat1-storage";
const DB_VERSION = 1;

const STORES = {
  projects: "projects",
  projectData: "projectData",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const store = db.createObjectStore(STORES.projects, { keyPath: "id" });
        store.createIndex("provider", "provider", { unique: false });
        store.createIndex("providerLocation", ["provider", "locationKey"], { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.projectData)) {
        db.createObjectStore(STORES.projectData, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => void
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    callback(store);
    tx.oncomplete = () => resolve(undefined as T);
    tx.onerror = () => reject(tx.error);
  });
}

export async function putProjectMetadata(record: StorageMetadataRecord): Promise<void> {
  await withStore<void>(STORES.projects, "readwrite", (store) => {
    store.put(record);
  });
}

export async function getProjectMetadata(id: string): Promise<StorageMetadataRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, "readonly");
    const store = tx.objectStore(STORES.projects);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as StorageMetadataRecord) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getProjectMetadataByLocation(
  provider: string,
  locationKey: string
): Promise<StorageMetadataRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, "readonly");
    const store = tx.objectStore(STORES.projects);
    const index = store.index("providerLocation");
    const req = index.get([provider, locationKey]);
    req.onsuccess = () => resolve((req.result as StorageMetadataRecord) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function listProjectMetadata(): Promise<StorageMetadataRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, "readonly");
    const store = tx.objectStore(STORES.projects);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as StorageMetadataRecord[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectMetadata(id: string): Promise<void> {
  await withStore<void>(STORES.projects, "readwrite", (store) => {
    store.delete(id);
  });
}

export async function putProjectData(id: string, blob: Blob): Promise<void> {
  await withStore<void>(STORES.projectData, "readwrite", (store) => {
    store.put({ id, blob, updatedAt: Date.now() });
  });
}

export async function getProjectData(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projectData, "readonly");
    const store = tx.objectStore(STORES.projectData);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result?.blob as Blob) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectData(id: string): Promise<void> {
  await withStore<void>(STORES.projectData, "readwrite", (store) => {
    store.delete(id);
  });
}
