import { takeQueue, dequeue } from '../lib/offline';
import { createReportServer, upsertItemsServer, uploadFileServer, updateStatusServer } from '../services/reportService';

export async function runQueue(onProgress?: (k:string)=>void) {
  const items = await takeQueue();
  for (const it of items) {
    const { key, job } = it;
    try {
      if (job.t === 'insert_report') await createReportServer(job.payload);
      else if (job.t === 'upsert_items') await upsertItemsServer(job.reportId, job.payload);
      else if (job.t === 'upload_file') await uploadFileServer(job.payload.reportId, job.payload.name, job.payload.blob);
      else if (job.t === 'update_status') await updateStatusServer(job.payload.reportId, job.payload.status, job.payload.note);
      await dequeue(key);
      onProgress?.(key);
    } catch (e) {
      // Laisse en file: on retentera automatiquement quand tu recliques "Sync"
      console.warn('Sync fail', e);
    }
  }
}
