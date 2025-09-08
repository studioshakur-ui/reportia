import { supabase } from '../lib/supabaseClient';
import { dbDrafts, dbFiles, enqueue, newReportId } from '../lib/offline';

export async function createReportLocal(draft:any) {
  const id = draft.id ?? newReportId();
  const data = { ...draft, id, status: draft.status ?? 'draft', updated_at_local: Date.now() };
  await dbDrafts.setItem(id, data);
  if (navigator.onLine) await enqueue({ t:'insert_report', payload: data });
  return id;
}

export async function attachFileLocal(reportId:string, file:File) {
  const name = `${reportId}/${Date.now()}_${file.name}`;
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  await dbFiles.setItem(name, { reportId, name, blob });
  if (navigator.onLine) await enqueue({ t:'upload_file', payload: { reportId, name, blob } });
  return name;
}

/* ==== Worker: appels réels côté serveur ==== */
export async function createReportServer(r:any) {
  const { error } = await supabase.from('reports').insert([{
    id: r.id, date: r.date, capo_id: r.capo_id, team_id: r.team_id,
    impianto_id: r.impianto_id, zone_id: r.zone_id, cn: r.cn,
    hours_total: r.hours_total, notes: r.notes, status: r.status
  }]);
  if (error) throw error;
}
export async function upsertItemsServer(reportId:string, items:any[]) {
  const payload = items.map(i => ({ ...i, report_id: reportId, unit: i.unit ?? 'n' }));
  const { error } = await supabase.from('report_items').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}
export async function uploadFileServer(reportId:string, name:string, blob:Blob) {
  const { error } = await supabase.storage.from('reportia').upload(`reports/${name}`, blob, { upsert: false });
  if (error) throw error;
}
export async function updateStatusServer(reportId:string, status:'submitted'|'approved'|'rejected', note?:string) {
  const { error } = await supabase.from('reports').update({ status, notes: note ?? null }).eq('id', reportId);
  if (error) throw error;
}

/* ==== Requêtes lecture pour UI ==== */
export async function fetchSubmittedReports(date?: string) {
  let q = supabase.from('reports').select('id,date,capo_id,impianto_id,zone_id,cn,hours_total,status').eq('status','submitted');
  if (date) q = q.eq('date', date);
  const { data, error } = await q.order('date', { ascending: false });
  if (error) throw error;
  return data;
}
