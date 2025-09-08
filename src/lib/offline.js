// --- IndexedDB utilitaires robustes (promisifiés) ---
const DB_NAME = 'reportia';
const DB_VERSION = 1;
const STORES = ['drafts', 'queue', 'files', 'imports', 'audit'];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(s => {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'key' });
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const res = fn(s);
    t.oncomplete = () => resolve(res);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function kvSet(store, key, value) {
  await tx(store, 'readwrite', s => s.put({ key, ...value }));
}
export async function kvGet(store, key) {
  return tx(store, 'readonly', s => new Promise((resolve, reject) => {
    const req = s.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}
export async function kvDel(store, key) {
  await tx(store, 'readwrite', s => s.delete(key));
}
export async function kvAll(store) {
  return tx(store, 'readonly', s => new Promise((resolve, reject) => {
    const out = [];
    const cur = s.openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) { out.push(c.value); c.continue(); } else resolve(out);
    };
    cur.onerror = () => reject(cur.error);
  }));
}

// --- UUID v4 sans dépendance ---
export function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

// --- Stores logiques ---
export const storeDrafts = 'drafts';     // rapports locaux
export const storeQueue  = 'queue';      // jobs à sync
export const storeFiles  = 'files';      // pièces (base64)
export const storeAudit  = 'audit';      // petit journal

// Files base64 <-> Blob
export async function fileToBase64(file) {
  const buf = await file.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
export function base64ToBlob(b64, type) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

// Queue (transaction simple)
export async function enqueue(job) {
  const key = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await kvSet(storeQueue, key, { key, job, ts: Date.now(), status: 'pending' });
  return key;
}
export async function allQueue() {
  const items = await kvAll(storeQueue);
  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}
export async function dequeue(key) { await kvDel(storeQueue, key); }
