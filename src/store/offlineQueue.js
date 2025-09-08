import { allQueue, dequeue } from '../lib/offline.js';
import { uploadFileServer, upsertLinesServer, createReportServer, updateStatusServer } from '../services/reportService.js';

/**
 * Exécute la file en séquence (idempotence côté serveur conseillée).
 * onEvent: (evt) => void avec {key, type:'start'|'ok'|'error', error?}
 */
export async function runQueue(onEvent) {
  const items = await allQueue();
  for (const it of items) {
    try {
      onEvent && onEvent({ key: it.key, type: 'start' });
      const { job } = it;
      if (job.t === 'insert_report') {
        await createReportServer(job.payload);
      } else if (job.t === 'upsert_lines') {
        await upsertLinesServer(job.reportId, job.payload);
      } else if (job.t === 'upload_file') {
        await uploadFileServer(job.payload.reportId, job.payload.name);
      } else if (job.t === 'update_status') {
        await updateStatusServer(job.payload.reportId, job.payload.status, job.payload.note);
      }
      await dequeue(it.key);
      onEvent && onEvent({ key: it.key, type: 'ok' });
    } catch (e) {
      console.warn('Queue item failed:', it.key, e);
      onEvent && onEvent({ key: it.key, type: 'error', error: String(e?.message || e) });
      // On laisse l'item ; l'utilisateur pourra relancer plus tard.
      break; // éviter boucle infinie si serveur HS
    }
  }
}
