import { supabase } from '../lib/supabaseClient';
import { dbDrafts, enqueue, newReportId, saveFileEntry } from '../lib/offline';

/* ==== Local (offline) ==== */
export async function createReportLocal(draft) {
  const id = draft.id || newReportId();
  const data = { ...draft, id, status: draft.status || 'draft', updated_at_local: Date.now() };
  await dbDrafts.setItem(id, data);
  if (navigator.onLine) await enqueue({ t: 'insert_report', payload: data });
  return id;
}

export async function attachFileLocal(reportId, file) {
  // On enregistre en base64 côté local (dbFiles) puis on enfile un job sans Blob
  const name = `${reportId}/${Date.now()}_${file.name}`;
  await saveFileEntry(reportId, name, file);
  if (navigator.onLine) await enqueue({ t: 'upload_file', payload: { reportId, name } });
  return name;
}

/* ==== Serveur (Supabase) ==== */
export async function createReportServer(r) {
  const { error } = await supabase.from('reports').insert([{
    id: r.id,
    date: r.date,
    capo_id: r.capo_id,
    team_id: r.team_id || null,
    impianto_id: r.impianto_id || null,
    zone_id: r.zone_id || null,
    cn: r.cn || null,
    hours_total: r.hours_total || 0,
    notes: r.notes || null,
    status: r.status || 'draft'
  }]);
  if (error) throw error;
}

export async function upsertItemsServer(reportId, items) {
  const payload = (items || []).map((i) => ({ ...i, report_id: reportId, unit: i.unit || 'n' }));
  if (!payload.length) return;
  const { error } = await supabase.from('report_items').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function uploadFileServer(reportId, name, blob) {
  const { error } = await supabase.storage.from('reportia').upload(`reports/${name}`, blob, { upsert: false });
  if (error) throw error;
}

export async function updateStatusServer(reportId, status, note) {
  const { error } = await supabase.from('reports').update({ status, notes: note || null }).eq('id', reportId);
  if (error) throw error;
}

/* ==== Lecture pour UI ==== */
export async function fetchSubmittedReports(date) {
  let q = supabase
    .from('reports')
    .select('id,date,capo_id,impianto_id,zone_id,cn,hours_total,status')
    .eq('status', 'submitted');
  if (date) q = q.eq('date', date);
  const { data, error } = await q.order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}
