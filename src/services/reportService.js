// src/services/reportService.js
import { supabase } from '../lib/supabaseClient.js';
import {
  uuid,
  kvSet,
  kvGet,
  storeDrafts,
  fileToBase64,
  base64ToBlob,
  storeFiles,
  enqueue,
} from '../lib/offline.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ---------- Draft local ----------
export async function createDraft(base) {
  const id = base?.id || uuid();
  const draft = {
    id,
    date: base?.date || new Date().toISOString().slice(0, 10),
    capo_id: base?.capo_id || null,
    cn: base?.cn || '',
    notes: base?.notes || '',
    hours_total: Number(base?.hours_total || 0),
    status: base?.status || 'draft',
    lines: base?.lines || [], // [{ worker_id, ore, descrizione, prodotto_qty, prodotto_unit, previsto, note }]
    updated_at_local: Date.now(),
  };
  await kvSet(storeDrafts, id, draft);
  return id;
}

export async function getDraft(id) {
  return await kvGet(storeDrafts, id);
}

export async function saveDraft(id, patch) {
  const cur = await getDraft(id);
  const next = { ...cur, ...patch, updated_at_local: Date.now() };
  await kvSet(storeDrafts, id, next);
  return next;
}

// ---------- Pièces jointes (local -> base64 en cache, upload via queue) ----------
export async function attachFileLocal(reportId, file, lineIndex = null) {
  const b64 = await fileToBase64(file);
  const name = `${reportId}/${Date.now()}_${file.name}`;
  await kvSet(storeFiles, name, {
    key: name,
    reportId,
    lineIndex,
    type: file.type,
    b64,
  });
  // enqueue l’upload (qui relira depuis IndexedDB)
  await enqueue({ t: 'upload_file', payload: { reportId, name } });
  return name;
}

// ---------- Soumission (enqueue) ----------
export async function submitReport(reportId) {
  const draft = await getDraft(reportId);
  if (!draft) throw new Error('Bozza mancante');

  // 1) Upsert report
  const payload = {
    id: draft.id,
    date: draft.date,
    capo_id: draft.capo_id,
    cn: draft.cn || null,
    hours_total: Number(draft.hours_total || 0),
    notes: draft.notes || null,
    status: 'submitted',
  };
  await enqueue({ t: 'insert_report', payload });

  // 2) Upsert lines
  if (Array.isArray(draft.lines) && draft.lines.length) {
    const rows = draft.lines.map((l, idx) => ({
      id: `${draft.id}-${idx + 1}`,
      report_id: draft.id,
      worker_id: l.worker_id || null,
      ore: Number(l.ore || 0),
      descrizione: l.descrizione || '',
      prodotto_qty: Number(l.prodotto_qty || 0),
      prodotto_unit: l.prodotto_unit || '',
      previsto: Number(l.previsto || 0),
      note: l.note || '',
      order_index: idx,
    }));
    await enqueue({ t: 'upsert_lines', reportId: draft.id, payload: rows });
  }

  // 3) Statut local
  await saveDraft(reportId, { status: 'submitted' });
  return true;
}

// ---------- Côté serveur (utilisées par la queue) ----------
export async function createReportServer(r) {
  const { error } = await supabase.from('reports').upsert([r], { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertLinesServer(reportId, rows) {
  const { error } = await supabase.from('report_lines').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function uploadFileServer(reportId, name) {
  const entry = await kvGet('files', name);
  if (!entry) throw new Error('Attachment non trovato localmente: ' + name);
  const blob = base64ToBlob(entry.b64, entry.type || 'application/octet-stream');
  const { error } = await supabase.storage.from('reportia').upload(`reports/${name}`, blob, { upsert: false });
  if (error) throw error;
}

export async function updateStatusServer(reportId, status, note) {
  const { error } = await supabase
    .from('reports')
    .update({ status, notes: note || null })
    .eq('id', reportId);
  if (error) throw error;
}

// ---------- Lecture Manager ----------
export async function fetchReportsByStatus(status, date) {
  let q = supabase
    .from('reports')
    .select('id,date,capo_id,cn,hours_total,status')
    .order('date', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  if (date) q = q.eq('date', date);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ---------- PDF (preview client) ----------
export async function buildReportPdf({ header, lines }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pad = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RAPPORTINO GIORNALIERO', pad, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const h = header || {};
  const rightX = 560;
  doc.text(`Capo squadra: ${h.capo || ''}`, pad, 65);
  doc.text(`Data: ${h.data || ''}`, rightX, 40, { align: 'right' });
  if (h.commessa) doc.text(`Commessa: ${h.commessa}`, pad, 80);
  if (h.zona) doc.text(`Zona: ${h.zona}`, pad, 95);
  if (h.cn) doc.text(`CN: ${h.cn}`, rightX, 55, { align: 'right' });

  const body = (lines || []).map((r) => [
    r.operatore_name || '',
    r.ore || '',
    r.descrizione || '',
    r.prodotto_qty != null ? String(r.prodotto_qty) : '',
    r.previsto != null ? String(r.previsto) : '',
    r.note || '',
  ]);

  doc.autoTable({
    startY: 110,
    head: [
      [
        'OPERATORE',
        "Tempo impiegato",
        "DESCRIZIONE ATTIVITA'",
        'PRODOTTO',
        'PREVISTO A PERSONA',
        'NOTE',
      ],
    ],
    body,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
    headStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 90, halign: 'center' },
      2: { cellWidth: 220 },
      3: { cellWidth: 80, halign: 'right' },
      4: { cellWidth: 100, halign: 'right' },
      5: { cellWidth: 120 },
    },
    margin: { left: pad, right: pad },
  });

  return doc.output('blob');
}
