// Save/Load manager for Map Builder
// Handles desktop (File System Access API) and mobile/tablet fallback (ZIP/JSON bundle)

/*
  Public API:
    - saveProject(projectState, { canvasRefs }): Saves to directory if supported, else exports a .zip
    - loadProject(): Prompts for folder or bundle file and returns hydrated state
    - exportBundle(projectState, { canvasRefs }): Forces .zip export (fallback mode)
    - importBundle(file): Reads a .zip/.json and returns hydrated state
*/

import JSZip from 'jszip';
import localforage from 'localforage';

const DIR_HANDLE_KEY = 'mapbuilder.project.dir.handle';
const PARENT_DIR_HANDLE_KEY = 'mapbuilder.parent.dir.handle';
const ASSETS_DIR_NAME = 'Assets';
const ASSETS_MANIFEST_FILE = 'manifest.json';
const MAPS_DIR_NAME = 'Maps';

const hasFSAccess = () => typeof window !== 'undefined' && !!window.showDirectoryPicker;

async function verifyPermission(handle, readWrite = false) {
  try {
    const opts = { mode: readWrite ? 'readwrite' : 'read' };
    if ((await handle.queryPermission?.(opts)) === 'granted') return true;
    if ((await handle.requestPermission?.(opts)) === 'granted') return true;
  } catch {}
  return false;
}

async function getStoredDirectoryHandle() {
  if (!localforage) return null;
  try {
    const handle = await localforage.getItem(DIR_HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

async function setStoredDirectoryHandle(handle) {
  if (!localforage) return;
  try {
    await localforage.setItem(DIR_HANDLE_KEY, handle);
  } catch {
    // ignore
  }
}

// In-memory handle for the current project directory (session-only)
let currentProjectDirHandleMem = null;
function getCurrentProjectDirHandle() { return currentProjectDirHandleMem; }
function setCurrentProjectDirHandle(h) { currentProjectDirHandleMem = h || null; }
export function hasCurrentProjectDir() { return !!currentProjectDirHandleMem; }
export function clearCurrentProjectDir() { currentProjectDirHandleMem = null; }

async function getStoredParentDirectoryHandle() {
  if (!localforage) return null;
  try {
    const handle = await localforage.getItem(PARENT_DIR_HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

async function setStoredParentDirectoryHandle(handle) {
  if (!localforage) return;
  try {
    await localforage.setItem(PARENT_DIR_HANDLE_KEY, handle);
  } catch {}
}

async function ensureAssetsDir(parentHandle) {
  const dir = await parentHandle.getDirectoryHandle(ASSETS_DIR_NAME, { create: true });
  return dir;
}

async function ensureMapsDir(parentHandle) {
  const dir = await parentHandle.getDirectoryHandle(MAPS_DIR_NAME, { create: true });
  return dir;
}

async function createUniqueMapDir(mapsDirHandle, baseName) {
  const base = sanitizeFolderName(baseName || 'Map');
  let name = base;
  let idx = 2;
  while (true) {
    try {
      await mapsDirHandle.getDirectoryHandle(name, { create: false });
      name = `${base} (${idx++})`;
    } catch {
      const handle = await mapsDirHandle.getDirectoryHandle(name, { create: true });
      return { handle, name };
    }
  }
}

async function readAssetsManifest(parentHandle) {
  try {
    const assetsDir = await parentHandle.getDirectoryHandle(ASSETS_DIR_NAME, { create: false });
    const mf = await assetsDir.getFileHandle(ASSETS_MANIFEST_FILE);
    const txt = await (await mf.getFile()).text();
    const data = JSON.parse(txt || '{}');
    if (data && Array.isArray(data.assets)) return data;
    return { version: 1, assets: [] };
  } catch {
    return { version: 1, assets: [] };
  }
}

async function writeAssetsManifest(parentHandle, manifest) {
  const assetsDir = await ensureAssetsDir(parentHandle);
  await writeFile(assetsDir, [ASSETS_MANIFEST_FILE], new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }));
}

function assetFilenameFor(a, variantIndex = null, blob) {
  const id = a.id || Math.random().toString(36).slice(2);
  let ext = 'png';
  if (blob && blob.type) ext = extFromType(blob.type);
  else if (a.src) {
    const m = (a.src.match(/\.([a-zA-Z0-9]+)(?:$|\?)/) || [])[1];
    if (m) ext = m.toLowerCase();
  }
  if (a.kind === 'natural' && variantIndex !== null) return `${id}-v${variantIndex}.${ext}`;
  return `${id}.${ext}`;
}

async function writeAssetsLibrary(parentHandle, assetsList) {
  const manifest = await readAssetsManifest(parentHandle);
  const byId = new Map((manifest.assets || []).map((x) => [x.id, x]));
  const outAssets = new Map(byId);
  const assetsDir = await ensureAssetsDir(parentHandle);

  for (const a of assetsList || []) {
    if (!a) continue;
    const base = stripAssetInMemoryFields(a);
    if (a.kind === 'image' || a.kind === 'token') {
      const blob = await blobFromSrc(a.src);
      let filename = base.path && base.path.startsWith(`${ASSETS_DIR_NAME}/`) ? base.path.split('/').slice(1).join('/') : null;
      if (!filename) filename = assetFilenameFor(a, null, blob);
      if (blob) await writeFile(assetsDir, [filename], blob);
      const entry = { ...base, path: `${ASSETS_DIR_NAME}/${filename}` };
      outAssets.set(entry.id, entry);
    } else if (a.kind === 'natural') {
      const variants = Array.isArray(a.variants) ? a.variants : [];
      const vOut = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const blob = await blobFromSrc(v?.src);
        let filename = v?.path && v.path.startsWith(`${ASSETS_DIR_NAME}/`) ? v.path.split('/').slice(1).join('/') : null;
        if (!filename) filename = assetFilenameFor(a, i, blob);
        if (blob) await writeFile(assetsDir, [filename], blob);
        vOut.push({ ...stripRuntimeFields(v), path: `${ASSETS_DIR_NAME}/${filename}` });
      }
      const entry = { ...base, variants: vOut };
      outAssets.set(entry.id, entry);
    } else {
      outAssets.set(base.id, base);
    }
  }

  const finalList = Array.from(outAssets.values());
  await writeAssetsManifest(parentHandle, { version: 1, assets: finalList });
  return finalList;
}

function stripAssetInMemoryFields(a) {
  const { img, ...rest } = a || {};
  return rest;
}

function toProjectJson(projectState) {
  const {
    version = 1,
    name,
    rows,
    cols,
    tileSize,
    maps,
    objects,
    tokens,
    assets,
    settings,
  } = projectState || {};
  return {
    version: version ?? 1,
    name: name || settings?.name || undefined,
    map: { rows, cols, gridSize: tileSize },
    settings: settings || {},
    assets: (assets || []).map(stripAssetInMemoryFields),
  };
}

function toTilesJson(projectState) {
  const { maps } = projectState || {};
  return { tiles: { background: maps?.background, base: maps?.base, sky: maps?.sky } };
}

function toObjectsJson(projectState) {
  const { objects, tokens } = projectState || {};
  return { objects: objects || {}, tokens: tokens || [] };
}

function toTokensJson(projectState) {
  const { tokens } = projectState || {};
  return { tokens: tokens || [] };
}

function createOffscreenCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(w || 1));
  c.height = Math.max(1, Math.floor(h || 1));
  return c;
}

async function captureCanvasPNG(canvas) {
  if (!canvas) return null;
  try {
    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
    return blob;
  } catch {
    return null;
  }
}

async function capturePerLayerPNGs(canvasRefs) {
  const out = { background: null, base: null, sky: null };
  if (!canvasRefs) return out;
  const layers = ['background', 'base', 'sky'];
  for (const layer of layers) {
    const c = canvasRefs?.[layer]?.current;
    // Only save non-empty canvases. We don't attempt to detect content; save if exists.
    const blob = await captureCanvasPNG(c);
    out[layer] = blob;
  }
  return out;
}

function extFromType(type) {
  if (!type) return 'png';
  const m = String(type).toLowerCase();
  if (m.includes('jpeg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  return 'png';
}

async function blobFromSrc(src) {
  if (!src) return null;
  try {
    // Support data URLs and object/file URLs
    const res = await fetch(src);
    return await res.blob();
  } catch {
    return null;
  }
}

async function writeFile(dirHandle, pathParts, data) {
  // pathParts: [dir?, ..., filename]
  let dir = dirHandle;
  for (let i = 0; i < pathParts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(pathParts[i], { create: true });
  }
  const filename = pathParts[pathParts.length - 1];
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  if (typeof data === 'string') await writable.write(new Blob([data], { type: 'application/json' }));
  else await writable.write(data);
  await writable.close();
}

function sanitizeFolderName(name) {
  const fallback = 'Map';
  if (!name || typeof name !== 'string') return fallback;
  let s = name.trim();
  if (!s) return fallback;
  // Remove Windows-reserved characters <>:"/\|?*
  s = s.replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim();
  // Avoid reserved device names
  const reserved = new Set(['CON','PRN','AUX','NUL','COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9','LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9']);
  if (reserved.has(s.toUpperCase())) s = `${s}-map`;
  // Disallow trailing dot/space on Windows
  s = s.replace(/[\.\s]+$/g, '');
  return s || fallback;
}

async function hydrateAssetsFromFS(projectJson, projectDirHandle, parentDirHandle) {
  const assets = Array.isArray(projectJson?.assets) ? projectJson.assets : [];
  const hydrated = [];
  for (const a of assets) {
    const base = { ...a };
    if (a.kind === 'image' || a.kind === 'token') {
      if (a.path) {
        try {
          const parts = a.path.split('/').filter(Boolean);
          let dir = (parts[0] === ASSETS_DIR_NAME && parentDirHandle)
            ? await parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME)
            : projectDirHandle;
          const startIndex = (parts[0] === ASSETS_DIR_NAME && parentDirHandle) ? 1 : 0;
          for (let i = startIndex; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i]);
          }
          const fh = await dir.getFileHandle(parts[parts.length - 1]);
          const file = await fh.getFile();
          const blob = file;
          const src = URL.createObjectURL(blob);
          const img = new Image();
          img.src = src;
          hydrated.push({ ...base, src, img });
          continue;
        } catch {}
      }
      hydrated.push(base);
    } else if (a.kind === 'natural') {
      const variants = Array.isArray(a.variants) ? a.variants : [];
      const vOut = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (v?.path) {
          try {
            const parts = v.path.split('/').filter(Boolean);
            let dir = (parts[0] === ASSETS_DIR_NAME && parentDirHandle)
              ? await parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME)
              : projectDirHandle;
            const startIndex = (parts[0] === ASSETS_DIR_NAME && parentDirHandle) ? 1 : 0;
            for (let j = startIndex; j < parts.length - 1; j++) {
              dir = await dir.getDirectoryHandle(parts[j]);
            }
            const fh = await dir.getFileHandle(parts[parts.length - 1]);
            const file = await fh.getFile();
            const blob = file;
            const src = URL.createObjectURL(blob);
            vOut.push({ ...v, src });
            continue;
          } catch {}
        }
        vOut.push(v);
      }
      hydrated.push({ ...base, variants: vOut });
    } else {
      hydrated.push(base);
    }
  }
  return hydrated;
}

async function buildProjectStateSnapshot(raw, canvasesOrSingleBlob = null) {
  // Convert disk/bundle JSONs into the in-app shape expected by MapBuilder
  const { map, settings, assets } = raw.project || raw || {};
  const { tiles } = raw.tiles || {};
  const { objects, tokens } = raw.objects || {};
  const rows = map?.rows || raw.rows || 20;
  const cols = map?.cols || raw.cols || 20;
  const tileSize = map?.gridSize || 32;
  const maps = tiles || raw.maps || { background: [], base: [], sky: [] };
  const assetsIn = assets || raw.assets || [];
  const canvasesInput = canvasesOrSingleBlob;
  let canvasDataUrl = null; // legacy single
  let canvases = null; // { background, base, sky } data URLs
  if (canvasesInput && typeof canvasesInput === 'object' && !(canvasesInput instanceof Blob)) {
    canvases = {};
    for (const layer of ['background', 'base', 'sky']) {
      const b = canvasesInput[layer];
      if (!b) { canvases[layer] = null; continue; }
      // Blob to data URL
      // eslint-disable-next-line no-await-in-loop
      canvases[layer] = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(b); });
    }
  } else if (canvasesInput instanceof Blob) {
    canvasDataUrl = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(canvasesInput); });
  }

  return {
    rows,
    cols,
    tileSize,
    maps,
    objects: objects || raw.objects || { background: [], base: [], sky: [] },
    tokens: tokens || raw.tokens || [],
    assets: assetsIn,
    settings: settings || raw.settings || {},
    canvasDataUrl,
    canvases,
  };
}

export async function saveProject(projectState, { canvasRefs, mapName } = {}) {
  // Desktop path: use FS API, else fallback to ZIP export
  try {
    const layerBlobs = await capturePerLayerPNGs(canvasRefs);
    if (hasFSAccess()) {
      // Use stored parent; do not open folder picker here
      const parent = await getStoredParentDirectoryHandle();
      const parentOk = parent ? await verifyPermission(parent, true) : false;
      if (!parentOk) return { ok: false, mode: 'error', code: 'NO_PARENT', message: 'No Account Save Folder configured.' };
      // If session project folder known, save there. Otherwise create Maps/<name>
      let projectDirHandle = getCurrentProjectDirHandle();
      let projectOk = projectDirHandle ? await verifyPermission(projectDirHandle, true) : false;
      if (!projectOk) {
        const folderName = sanitizeFolderName(mapName || projectState?.name || projectState?.settings?.name || 'Map');
        const mapsDir = await ensureMapsDir(parent);
        projectDirHandle = await mapsDir.getDirectoryHandle(folderName, { create: true });
        projectOk = await verifyPermission(projectDirHandle, true);
        setCurrentProjectDirHandle(projectDirHandle);
      }
      if (!projectOk) return { ok: false, mode: 'error', message: 'Permission denied' };

      // Write files
      const projectJson = toProjectJson({ ...projectState, name: mapName || projectState?.name || projectState?.settings?.name });
      const objectsJson = toObjectsJson(projectState);
      const tokensJson = toTokensJson(projectState);
      const tilesJson = toTilesJson(projectState);
      // Write/update shared Assets library under parent
      const assetListOut = await writeAssetsLibrary(parent, projectState.assets || []);
      projectJson.assets = assetListOut.map((x) => ({ ...x }));

      // Write JSON files
      await writeFile(projectDirHandle, ['project.json'], new Blob([JSON.stringify(projectJson, null, 2)], { type: 'application/json' }));
      await writeFile(projectDirHandle, ['tiles.json'], new Blob([JSON.stringify(tilesJson, null, 2)], { type: 'application/json' }));
      await writeFile(projectDirHandle, ['objects.json'], new Blob([JSON.stringify(objectsJson, null, 2)], { type: 'application/json' }));
      await writeFile(projectDirHandle, ['tokens.json'], new Blob([JSON.stringify(tokensJson, null, 2)], { type: 'application/json' }));
      // Per-layer canvas images
      if (layerBlobs.background) await writeFile(projectDirHandle, ['canvas-background.png'], layerBlobs.background);
      if (layerBlobs.base) await writeFile(projectDirHandle, ['canvas-base.png'], layerBlobs.base);
      if (layerBlobs.sky) await writeFile(projectDirHandle, ['canvas-sky.png'], layerBlobs.sky);

      // Remember current project dir handle for this session only
      setCurrentProjectDirHandle(projectDirHandle);

      return { ok: true, mode: 'fs', message: 'Project saved to folder.' };
    }

    // Fallback: ZIP export
    const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName });
    return { ok: !!res, mode: 'zip', message: 'Bundle exported.' };
  } catch (err) {
    console.error('saveProject error', err);
    try {
      const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName });
      return { ok: !!res, mode: 'zip', message: 'Bundle exported (fallback).' };
    } catch (e2) {
      console.error('export fallback failed', e2);
      return { ok: false, mode: 'error', message: 'Failed to save project.' };
    }
  }
}

export async function loadProject() {
  // Try FS folder pick first when supported, else file input for .zip/.json
  if (hasFSAccess()) {
    try {
      // Step 1: choose parent folder (start from stored parent if available)
      let parent = await getStoredParentDirectoryHandle();
      try {
        parent = await window.showDirectoryPicker({ id: 'mapbuilder-parent-open', mode: 'readwrite', startIn: parent || undefined });
      } catch {
        parent = await window.showDirectoryPicker({ id: 'mapbuilder-parent-open', mode: 'readwrite' });
      }
      const pOk = await verifyPermission(parent, true);
      if (!pOk) throw new Error('Permission denied');
      await setStoredParentDirectoryHandle(parent);

      // Step 2: choose project folder within parent
      let dirHandle = null;
      try {
        dirHandle = await window.showDirectoryPicker({ id: 'mapbuilder-project-open', mode: 'readwrite', startIn: parent });
      } catch {
        dirHandle = await window.showDirectoryPicker({ id: 'mapbuilder-project-open', mode: 'readwrite' });
      }
      const ok = await verifyPermission(dirHandle, true);
      if (!ok) throw new Error('Permission denied');
      setCurrentProjectDirHandle(dirHandle);

      // Read JSONs
      const projectFile = await (await (await dirHandle.getFileHandle('project.json')).getFile()).text();
      const tilesFile = await (await (await dirHandle.getFileHandle('tiles.json')).getFile()).text();
      const objectsFile = await (await (await dirHandle.getFileHandle('objects.json')).getFile()).text();
      let tokensTop = null;
      try {
        const tf = await (await dirHandle.getFileHandle('tokens.json')).getFile();
        const txt = await tf.text();
        const doc = JSON.parse(txt || '{}');
        if (Array.isArray(doc?.tokens)) tokensTop = doc.tokens;
      } catch {}
      // Try per-layer canvas images; fallback to single canvas.png
      const canvases = { background: null, base: null, sky: null };
      try { const f = await (await dirHandle.getFileHandle('canvas-background.png')).getFile(); canvases.background = f; } catch {}
      try { const f = await (await dirHandle.getFileHandle('canvas-base.png')).getFile(); canvases.base = f; } catch {}
      try { const f = await (await dirHandle.getFileHandle('canvas-sky.png')).getFile(); canvases.sky = f; } catch {}
      let singleCanvas = null;
      if (!canvases.background && !canvases.base && !canvases.sky) {
        try { const cf = await (await dirHandle.getFileHandle('canvas.png')).getFile(); singleCanvas = cf; } catch {}
      }

      const raw = { project: JSON.parse(projectFile || '{}'), tiles: JSON.parse(tilesFile || '{}'), objects: JSON.parse(objectsFile || '{}') };
      if (tokensTop) raw.tokens = tokensTop;
      // Load library manifest from parent/Assets and hydrate
      const libManifest = await readAssetsManifest(parent);
      const libAssetsHydrated = await hydrateAssetsFromFS({ assets: libManifest.assets }, dirHandle, parent);
      // Hydrate project assets and merge (lib takes precedence)
      const projHydrated = await hydrateAssetsFromFS(raw.project, dirHandle, parent);
      const byId = new Map(libAssetsHydrated.map((a) => [a.id, a]));
      for (const a of projHydrated) if (!byId.has(a.id)) byId.set(a.id, a);
      raw.project.assets = Array.from(byId.values());

      const snapshot = await buildProjectStateSnapshot(raw, (canvases.background || canvases.base || canvases.sky) ? canvases : singleCanvas);
      return { ok: true, mode: 'fs', data: snapshot };
    } catch (err) {
      console.error('loadProject FS error', err);
      // Fall through to bundle picker
    }
  }

  // Fallback: file picker
  const file = await pickFile(['application/zip', 'application/json', '.zip', '.json']);
  if (!file) return { ok: false, mode: 'cancel' };
  try {
    const data = await importBundle(file);
    return { ok: true, mode: 'zip', data };
  } catch (err) {
    console.error('importBundle error', err);
    return { ok: false, mode: 'error', message: 'Failed to load project.' };
  }
}

export async function saveProjectAs(projectState, { canvasRefs, mapName } = {}) {
  // Force choose parent folder, create new subfolder named by mapName
  try {
    const layerBlobs = await capturePerLayerPNGs(canvasRefs);
    if (!hasFSAccess()) {
      // Fallback to bundle with desired filename
      const res = await exportBundle(projectState, { canvasRefs, silent: false, mapName });
      return { ok: !!res, mode: 'zip', message: 'Bundle exported.' };
    }
    const parent = await getStoredParentDirectoryHandle();
    const pOk = parent ? await verifyPermission(parent, true) : false;
    if (!pOk) return { ok: false, mode: 'error', code: 'NO_PARENT', message: 'No Account Save Folder configured.' };
    const mapsDir = await ensureMapsDir(parent);
    const { handle: projectDirHandle } = await createUniqueMapDir(mapsDir, mapName || projectState?.name || projectState?.settings?.name || 'Map');
    const ok = await verifyPermission(projectDirHandle, true);
    if (!ok) throw new Error('Permission denied');

    // Write files
    const projectJson = toProjectJson({ ...projectState, name: mapName || projectState?.name || projectState?.settings?.name });
    const objectsJson = toObjectsJson(projectState);
    const tokensJson = toTokensJson(projectState);
    const tilesJson = toTilesJson(projectState);
    // Write/update Assets library in parent folder
    const assetListOut = await writeAssetsLibrary(parent, projectState.assets || []);
    projectJson.assets = assetListOut.map((x) => ({ ...x }));

    await writeFile(projectDirHandle, ['project.json'], new Blob([JSON.stringify(projectJson, null, 2)], { type: 'application/json' }));
    await writeFile(projectDirHandle, ['tiles.json'], new Blob([JSON.stringify(tilesJson, null, 2)], { type: 'application/json' }));
    await writeFile(projectDirHandle, ['objects.json'], new Blob([JSON.stringify(objectsJson, null, 2)], { type: 'application/json' }));
    await writeFile(projectDirHandle, ['tokens.json'], new Blob([JSON.stringify(tokensJson, null, 2)], { type: 'application/json' }));
    if (layerBlobs.background) await writeFile(projectDirHandle, ['canvas-background.png'], layerBlobs.background);
    if (layerBlobs.base) await writeFile(projectDirHandle, ['canvas-base.png'], layerBlobs.base);
    if (layerBlobs.sky) await writeFile(projectDirHandle, ['canvas-sky.png'], layerBlobs.sky);

    // Persist new parent and project dir for future
    await setStoredParentDirectoryHandle(parent);
    setCurrentProjectDirHandle(projectDirHandle);

    return { ok: true, mode: 'fs', message: 'Project saved to folder.' };
  } catch (err) {
    console.error('saveProjectAs error', err);
    return { ok: false, mode: 'error', message: 'Failed to save project.' };
  }
}

async function pickFile(accept) {
  // Try native picker; else fallback to hidden input element
  try {
    if (window.showOpenFilePicker) {
      const [h] = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'Project Bundle', accept: { '*/*': accept } }] });
      const f = await h.getFile();
      return f;
    }
  } catch {}
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.zip,.json,application/zip,application/json';
    inp.onchange = () => resolve(inp.files?.[0] || null);
    inp.click();
  });
}

export async function exportBundle(projectState, { canvasRefs, silent = false, mapName } = {}) {
  const zip = new JSZip();
  const projectJson = toProjectJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tilesJson = toTilesJson(projectState);
  const tokensJson = toTokensJson(projectState);

  // Assets into /Assets
  const assetsOut = [];
  for (const a of projectState.assets || []) {
    const base = stripAssetInMemoryFields(a);
    if (a.kind === 'image' || a.kind === 'token') {
      const blob = await blobFromSrc(a.src);
      if (blob) {
        const ext = extFromType(blob.type);
        const filename = `${a.id || Math.random().toString(36).slice(2)}.${ext}`;
        zip.file(`${ASSETS_DIR_NAME}/${filename}`, blob);
        assetsOut.push({ ...base, path: `${ASSETS_DIR_NAME}/${filename}` });
      } else {
        assetsOut.push(base);
      }
    } else if (a.kind === 'natural') {
      const variants = Array.isArray(a.variants) ? a.variants : [];
      const vOut = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const blob = await blobFromSrc(v?.src);
        if (blob) {
          const ext = extFromType(blob.type);
          const filename = `${a.id || 'natural'}-v${i}.${ext}`;
          zip.file(`${ASSETS_DIR_NAME}/${filename}`, blob);
          vOut.push({ ...v, path: `${ASSETS_DIR_NAME}/${filename}` });
        } else {
          vOut.push(v);
        }
      }
      assetsOut.push({ ...base, variants: vOut });
    } else {
      assetsOut.push(base);
    }
  }
  projectJson.assets = assetsOut;
  // Write manifest for Assets in bundle
  zip.file(`${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`, JSON.stringify({ version: 1, assets: assetsOut }, null, 2));
  zip.file('project.json', JSON.stringify(projectJson, null, 2));
  zip.file('tiles.json', JSON.stringify(tilesJson, null, 2));
  zip.file('objects.json', JSON.stringify(objectsJson, null, 2));
  zip.file('tokens.json', JSON.stringify(tokensJson, null, 2));

  // Per-layer canvas files
  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  if (layerBlobs.background) zip.file('canvas-background.png', layerBlobs.background);
  if (layerBlobs.base) zip.file('canvas-base.png', layerBlobs.base);
  if (layerBlobs.sky) zip.file('canvas-sky.png', layerBlobs.sky);

  const content = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  const base = sanitizeFolderName(mapName || projectState?.name || projectState?.settings?.name || 'mapbuilder-project');
  a.download = `${base}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  if (!silent) alert('Project bundle exported.');
  return true;
}

export async function importBundle(file) {
  const isZip = /\.zip$/i.test(file.name) || file.type === 'application/zip';
  if (!isZip) {
    // Treat as JSON; accept our project.json-like combined object
    const txt = await file.text();
    const raw = JSON.parse(txt || '{}');
    const snapshot = await buildProjectStateSnapshot(raw, null);
    // Assets likely embedded as data URLs; hydrate images
    snapshot.assets = (snapshot.assets || []).map((a) => {
      if ((a.kind === 'image' || a.kind === 'token') && a.src) {
        const img = new Image();
        img.src = a.src;
        return { ...a, img };
      }
      if (a.kind === 'natural' && Array.isArray(a.variants)) {
        return { ...a };
      }
      return a;
    });
    return snapshot;
  }

  const zip = await JSZip.loadAsync(file);
  const readJson = async (name) => {
    const f = zip.file(name);
    if (!f) return null;
    const txt = await f.async('text');
    return JSON.parse(txt || '{}');
  };
  const project = await readJson('project.json');
  const tiles = await readJson('tiles.json');
  const objects = await readJson('objects.json');
  const tokensDoc = await readJson('tokens.json');
  const canvases = { background: null, base: null, sky: null };
  const cb = zip.file('canvas-background.png');
  const cbase = zip.file('canvas-base.png');
  const csky = zip.file('canvas-sky.png');
  if (cb) canvases.background = await cb.async('blob');
  if (cbase) canvases.base = await cbase.async('blob');
  if (csky) canvases.sky = await csky.async('blob');
  let singleCanvas = null;
  if (!cb && !cbase && !csky) {
    const c = zip.file('canvas.png');
    if (c) singleCanvas = await c.async('blob');
  }

  // Hydrate asset srcs from embedded files
  // Prefer manifest if available
  let assetsIn = Array.isArray(project?.assets) ? project.assets : [];
  try {
    const mfEntry = zip.file(`${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`);
    if (mfEntry) {
      const txt = await mfEntry.async('text');
      const mf = JSON.parse(txt || '{}');
      if (Array.isArray(mf.assets)) assetsIn = mf.assets;
    }
  } catch {}
  const hydrated = [];
  for (const a of assetsIn) {
    if (a.kind === 'image' || a.kind === 'token') {
      if (a.path && zip.file(a.path)) {
        const blob = await zip.file(a.path).async('blob');
        const src = URL.createObjectURL(blob);
        const img = new Image();
        img.src = src;
        hydrated.push({ ...a, src, img });
      } else {
        hydrated.push(a);
      }
    } else if (a.kind === 'natural') {
      const vOut = [];
      for (const v of a.variants || []) {
        if (v.path && zip.file(v.path)) {
          const blob = await zip.file(v.path).async('blob');
          const src = URL.createObjectURL(blob);
          vOut.push({ ...v, src });
        } else {
          vOut.push(v);
        }
      }
      hydrated.push({ ...a, variants: vOut });
    } else {
      hydrated.push(a);
    }
  }

  const raw = { project: { ...(project || {}), assets: hydrated }, tiles, objects };
  if (tokensDoc && Array.isArray(tokensDoc.tokens)) raw.tokens = tokensDoc.tokens;
  const snapshot = await buildProjectStateSnapshot(raw, (canvases.background || canvases.base || canvases.sky) ? canvases : singleCanvas);
  return snapshot;
}

// ===== Global Assets Persistence (IndexedDB via localforage) =====

const ASSETS_STORE_KEY = 'mapbuilder.assets.store.v1';

function stripRuntimeFields(a) {
  const { img, src, ...rest } = a || {};
  return rest;
}

export async function saveGlobalAssets(assets) {
  if (!localforage) return false;
  try {
    const out = [];
    for (const a of assets || []) {
      const base = stripRuntimeFields(a);
      if (a.kind === 'image' || a.kind === 'token') {
        const blob = await blobFromSrc(a.src);
        out.push({ ...base, kind: a.kind, data: blob || null });
      } else if (a.kind === 'natural') {
        const variants = Array.isArray(a.variants) ? a.variants : [];
        const vOut = [];
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const blob = await blobFromSrc(v?.src);
          vOut.push({ ...stripRuntimeFields(v), data: blob || null });
        }
        out.push({ ...base, kind: 'natural', variants: vOut });
      } else {
        // color, tokenGroup, or others (metadata only)
        out.push({ ...base });
      }
    }
    await localforage.setItem(ASSETS_STORE_KEY, out);
    return true;
  } catch (e) {
    console.error('saveGlobalAssets error', e);
    return false;
  }
}

export async function loadGlobalAssets() {
  if (!localforage) return [];
  try {
    const arr = (await localforage.getItem(ASSETS_STORE_KEY)) || [];
    const hydrated = [];
    for (const a of arr) {
      if (a.kind === 'image' || a.kind === 'token') {
        let src = null; let img = null; let ar = a.aspectRatio || 1;
        if (a.data instanceof Blob) {
          src = URL.createObjectURL(a.data);
          img = new Image();
          img.src = src;
        } else if (a.src) {
          // legacy persisted with src string
          src = a.src; img = new Image(); img.src = src;
        }
        hydrated.push({ ...a, src, img, aspectRatio: ar });
      } else if (a.kind === 'natural') {
        const vOut = [];
        for (const v of a.variants || []) {
          if (v.data instanceof Blob) {
            const src = URL.createObjectURL(v.data);
            vOut.push({ ...v, src });
          } else if (v.src) {
            vOut.push({ ...v });
          } else {
            vOut.push(v);
          }
        }
        hydrated.push({ ...a, variants: vOut });
      } else {
        hydrated.push(a);
      }
    }
    return hydrated;
  } catch (e) {
    console.error('loadGlobalAssets error', e);
    return [];
  }
}

// Load assets from stored parent Assets folder on startup
export async function loadAssetsFromStoredParent() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, false) : false;
    if (!ok) return [];
    const manifest = await readAssetsManifest(parent);
    const hydrated = await hydrateAssetsFromFS({ assets: manifest.assets }, null, parent);
    return hydrated;
  } catch (e) {
    console.error('loadAssetsFromStoredParent error', e);
    return [];
  }
}

export async function listMaps() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, false) : false;
    if (!ok) return [];
    const results = [];
    const scanDir = async (dirHandle) => {
      // iterate entries; find subfolders with project.json
      for await (const [name, handle] of dirHandle.entries ? dirHandle.entries() : dirHandle) {
        try {
          const isDir = handle.kind === 'directory' || handle.getDirectoryHandle;
          if (!isDir) continue;
          // check project.json
          try {
            const f = await handle.getFileHandle('project.json');
            const file = await f.getFile();
            const txt = await file.text();
            const proj = JSON.parse(txt || '{}');
            const displayName = proj?.name || name;
            results.push({ name: displayName, folderName: name, dirHandle: handle, mtime: file.lastModified || 0 });
          } catch {}
        } catch {}
      }
    };
    // Only scan Maps folder (where we save maps)
    try {
      const mapsDir = await parent.getDirectoryHandle(MAPS_DIR_NAME, { create: true });
      await scanDir(mapsDir);
    } catch {}
    // sort by mtime desc
    results.sort((a,b)=> (b.mtime||0)-(a.mtime||0));
    return results;
  } catch (e) {
    console.error('listMaps error', e);
    return [];
  }
}

export async function loadProjectFromDirectory(dirHandle) {
  try {
    const ok = await verifyPermission(dirHandle, true);
    if (!ok) throw new Error('Permission denied');
    const parent = await getStoredParentDirectoryHandle();
    // Read JSONs
    const projectFile = await (await (await dirHandle.getFileHandle('project.json')).getFile()).text();
    const tilesFile = await (await (await dirHandle.getFileHandle('tiles.json')).getFile()).text();
    const objectsFile = await (await (await dirHandle.getFileHandle('objects.json')).getFile()).text();
    let tokensTop = null;
    try {
      const tf = await (await dirHandle.getFileHandle('tokens.json')).getFile();
      const txt = await tf.text();
      const doc = JSON.parse(txt || '{}');
      if (Array.isArray(doc?.tokens)) tokensTop = doc.tokens;
    } catch {}
    // canvases
    const canvases = { background: null, base: null, sky: null };
    try { const f = await (await dirHandle.getFileHandle('canvas-background.png')).getFile(); canvases.background = f; } catch {}
    try { const f = await (await dirHandle.getFileHandle('canvas-base.png')).getFile(); canvases.base = f; } catch {}
    try { const f = await (await dirHandle.getFileHandle('canvas-sky.png')).getFile(); canvases.sky = f; } catch {}
    let singleCanvas = null;
    if (!canvases.background && !canvases.base && !canvases.sky) {
      try { const cf = await (await dirHandle.getFileHandle('canvas.png')).getFile(); singleCanvas = cf; } catch {}
    }
    const raw = { project: JSON.parse(projectFile || '{}'), tiles: JSON.parse(tilesFile || '{}'), objects: JSON.parse(objectsFile || '{}') };
    if (tokensTop) raw.tokens = tokensTop;
    // Assets from parent/Assets
    const libManifest = await readAssetsManifest(parent);
    const libAssetsHydrated = await hydrateAssetsFromFS({ assets: libManifest.assets }, dirHandle, parent);
    const projHydrated = await hydrateAssetsFromFS(raw.project, dirHandle, parent);
    const byId = new Map(libAssetsHydrated.map((a) => [a.id, a]));
    for (const a of projHydrated) if (!byId.has(a.id)) byId.set(a.id, a);
    raw.project.assets = Array.from(byId.values());
    const snapshot = await buildProjectStateSnapshot(raw, (canvases.background || canvases.base || canvases.sky) ? canvases : singleCanvas);
    // Remember current project dir for this session
    setCurrentProjectDirHandle(dirHandle);
    return { ok: true, mode: 'fs', data: snapshot };
  } catch (e) {
    console.error('loadProjectFromDirectory error', e);
    return { ok: false, mode: 'error' };
  }
}

export async function deleteMap(folderName) {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, true) : false;
    if (!ok) return { ok: false, message: 'No Account Save Folder configured.' };
    const mapsDir = await ensureMapsDir(parent);
    try {
      await mapsDir.removeEntry(folderName, { recursive: true });
      return { ok: true };
    } catch (e) {
      console.error('removeEntry failed', e);
      return { ok: false, message: 'Failed to delete map.' };
    }
  } catch (e) {
    console.error('deleteMap error', e);
    return { ok: false, message: 'Failed to delete map.' };
  }
}

export async function chooseAssetsFolder() {
  try {
    let parent = await getStoredParentDirectoryHandle();
    try {
      parent = await window.showDirectoryPicker({ id: 'mapbuilder-assets-parent', mode: 'readwrite', startIn: parent || undefined });
    } catch {
      parent = await window.showDirectoryPicker({ id: 'mapbuilder-assets-parent', mode: 'readwrite' });
    }
    const ok = await verifyPermission(parent, true);
    if (!ok) throw new Error('Permission denied');
    await setStoredParentDirectoryHandle(parent);
    // Ensure Assets dir + manifest
    await ensureAssetsDir(parent);
    const manifest = await readAssetsManifest(parent);
    if (!manifest || !Array.isArray(manifest.assets)) {
      await writeAssetsManifest(parent, { version: 1, assets: [] });
    }
    const hydrated = await hydrateAssetsFromFS({ assets: (manifest.assets || []) }, null, parent);
    return { ok: true, assets: hydrated };
  } catch (e) {
    console.error('chooseAssetsFolder error', e);
    return { ok: false, assets: [] };
  }
}

export async function isAssetsFolderConfigured() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    if (!parent) return false;
    const ok = await verifyPermission(parent, false);
    return !!ok;
  } catch {
    return false;
  }
}
