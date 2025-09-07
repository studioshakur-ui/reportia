// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// --- Outbox (offline) via localStorage ---
const OUTBOX_KEY = "reportia_outbox";

function readOutbox() {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); }
  catch { return []; }
}
function writeOutbox(items) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

/** Sauvegarde un rapport (online → Supabase, sinon → outbox) */
export async function saveReport(row) {
  // row = { id, date, capo, plant, payload, updated_at? }
  if (!supabase || !navigator.onLine) {
    const box = readOutbox();
    box.push({ type: "upsert", entity: "reports_app", payload: row, ts: Date.now() });
    writeOutbox(box);
    return { queued: true };
  }
  const { error } = await supabase.from("reports_app").upsert(row, { onConflict: "id" });
  if (error) {
    // fallback → outbox
    const box = readOutbox();
    box.push({ type: "upsert", entity: "reports_app", payload: row, ts: Date.now() });
    writeOutbox(box);
    return { queued: true, error };
  }
  return { ok: true };
}

/** Vide la file d’attente (appelée au démarrage et quand on repasse online) */
export async function flushOutbox() {
  if (!supabase || !navigator.onLine) return;
  const box = readOutbox();
  if (!box.length) return;

  const rest = [];
  for (const job of box) {
    try {
      if (job.entity === "reports_app" && job.type === "upsert") {
        const { error } = await supabase
          .from("reports_app")
          .upsert(job.payload, { onConflict: "id" });
        if (error) throw error;
      }
    } catch {
      // on garde ce job pour plus tard
      rest.push(job);
    }
  }
  writeOutbox(rest);
}
