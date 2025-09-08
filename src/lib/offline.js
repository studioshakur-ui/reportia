// offline.js — implémentation sans dépendances (localStorage)
// Fournit: dbDrafts/dbQueue/dbFiles style localforage, + file helpers, + uuid()

/* ====== Petit générateur UUID v4 sans dépendance ====== */
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // fallback
  const rnd = (n = 16) => Array.from({ length: n }, () => Math.floor(Math.random() * 256));
  const bytes = rnd(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const toHex = (b) => b.toString(16).padStart(2, '0');
  const hex = bytes.map(toHex).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/* ====== Storage minimaliste par préfixe ====== */
function makeStore(prefix) {
  const p = `${prefix}::`;
  return {
    async setItem(key, value) {
      const v = JSON.stringify(value);
      localStorage.setItem(p + key, v);
    },
    async getItem(key) {
      const v = localStorage.getItem(p + key);
      return v ? JSON.parse(v) : null;
    },
    async removeItem(key) {
      localStorage.removeItem(p + key);
    },
    async iterate(fn) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(p)) {
          const v = JSON.parse(localStorage.getItem(k));
          await fn(v, k.slice(p.length));
        }
      }
    }
  };
}

/* ====== Instances (équivalents localforage) ====== */
export const dbDrafts = makeStore('reportia_drafts');
export const dbQueue  = makeStore('reportia_queue');
export const dbFiles  = makeStore('reportia_files'); // on stocke des métadonnées + base64

/* ====== Helpers files (Blob <-> base64) ====== */
async function fileToBase64(file) {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBlob(b64, type) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/* ====== API publique ====== */
export function newReportId() { return uuidv4(); }

/** Queue */
export async function enqueue(job) {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await dbQueue.setItem(key, { key, job });
  return key;
}
export async function takeQueue() {
  const items = [];
  await dbQueue.iterate((v) => items.push(v));
  items.sort((a, b) => (a.key < b.key ? -1 : 1));
  return items;
}
export async function dequeue(key) { await dbQueue.removeItem(key); }

/** Files: on stocke { reportId, name, type, b64 } */
export async function saveFileEntry(reportId, name, file) {
  const b64 = await fileToBase64(file);
  const entry = { reportId, name, type: file.type || 'application/octet-stream', b64 };
  await dbFiles.setItem(name, entry);
  return entry;
}
export async function getFileEntry(name) {
  const entry = await dbFiles.getItem(name);
  if (!entry) return null;
  const blob = base64ToBlob(entry.b64, entry.type);
  return { ...entry, blob };
}
