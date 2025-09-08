import localforage from 'localforage';
import { v4 as uuid } from 'uuid';

export const dbDrafts = localforage.createInstance({ name: 'reportia', storeName: 'drafts' });
export const dbQueue  = localforage.createInstance({ name: 'reportia', storeName: 'queue' });
export const dbFiles  = localforage.createInstance({ name: 'reportia', storeName: 'attachments' });

export function newReportId() { return uuid(); }

export async function enqueue(job) {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await dbQueue.setItem(key, { key, job });
  return key;
}

export async function takeQueue() {
  const items = [];
  await dbQueue.iterate((v) => items.push(v));
  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}

export async function dequeue(key) {
  await dbQueue.removeItem(key);
}
