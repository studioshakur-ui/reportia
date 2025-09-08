import { takeQueue, dequeue, getFileEntry } from '../lib/offline';
import { createReportServer, upsertItemsServer, uploadFileServer, updateStatusServer } from '../services/reportService';

export async function runQueue(onProgress) {
  const items = await takeQueue();
  for (const it of items) {
    const { key, job } = it;
    try {
      if (job.t === 'insert_report') {
        await createReportServer(job.payload);
      } else if (job.t === 'upsert_items') {
        await upsertItemsServer(job.reportId, job.payload);
      } else if (job.t === 'upload_file') {
        // Récupère le Blob depuis le storage local (base64 -> Blob)
        const entry = await getFileEntry(job.payload.name);
        if (!entry) throw new Error('Fichier manquant en local: ' + job.payload.name);
        await uploadFileServer(job.payload.reportId, job.payload.name, entry.blob);
      } else if (job.t === 'update_status') {
        await updateStatusServer(job.payload.reportId, job.payload.status, job.payload.note);
      }
      await dequeue(key);
      if (onProgress) onProgress(key);
    } catch (e) {
      console.warn('Sync fail, will retry later', e);
      // On laisse dans la queue pour réessayer plus tard
    }
  }
}
