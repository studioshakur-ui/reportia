export async function initOfflineStore() {
  // Ici tu brancheras IndexedDB/PouchDB plus tard.
  // On simule une init non bloquante.
  return Promise.resolve(true);
}

export async function safeInitOffline() {
  try {
    await initOfflineStore();
  } catch (e) {
    console.warn("Offline init skipped:", e);
  }
}
