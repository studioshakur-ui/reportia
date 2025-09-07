import CryptoJS from "crypto-js";

/**
 * Clé de chiffrement locale (Vite) :
 * définis VITE_STORAGE_KEY="une-cle-secrete" dans ton .env
 */
const KEY: string = (import.meta as any).env?.VITE_STORAGE_KEY || "dev-key-change-me";

export function saveEncrypted(key: string, data: unknown): void {
  try {
    const json = JSON.stringify(data);
    const enc = CryptoJS.AES.encrypt(json, KEY).toString();
    localStorage.setItem(key, enc);
  } catch {
    // ignore
  }
}

export function loadDecrypted<T>(key: string, fallback: T): T {
  try {
    const enc = localStorage.getItem(key);
    if (!enc) return fallback;
    const bytes = CryptoJS.AES.decrypt(enc, KEY);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Audit minimal : ajoute une ligne [timestamp, event, payload] en local chiffré */
export function auditLog(event: string, payload?: Record<string, unknown>): void {
  const line = { t: new Date().toISOString(), event, ...(payload || {}) };
  const key = "np_audit";
  const arr = loadDecrypted<any[]>(key, []);
  arr.push(line);
  saveEncrypted(key, arr);
}
