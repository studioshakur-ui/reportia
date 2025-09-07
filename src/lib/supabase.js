// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// --- Client
const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = url && key ? createClient(url, key) : null;

// --- Outbox simple pour offline (reports + plan)
const OUTBOX_KEY = "supabase.outbox.v1";
const loadOutbox = () => {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch { return []; }
};
const saveOutbox = (arr) => {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr)); } catch {}
};

// Utilitaire générique
async function trySupabase(fn) {
  if (!supabase) throw new Error("Supabase non configuré (.env).");
  const { data, error } = await fn();
  if (error) throw error;
  return data;
}

// --- REPORTS (tu avais déjà quelque chose d’approchant)
export async function saveReport(row) {
  // tente immédiat
  try {
    await trySupabase(() =>
      supabase.from("reports").insert(row).select().single()
    );
    return { ok: true };
  } catch (e) {
    // offline ⇒ outbox
    const box = loadOutbox();
    box.push({ type: "report", payload: row });
    saveOutbox(box);
    return { ok: false, queued: true, error: String(e.message || e) };
  }
}

// --- PLAN
export async function savePlanSnapshot(day, payload) {
  // payload = { taskId, impiantoId, capoId, team: [...] }
  const row = { day, payload, updated_at: new Date().toISOString() };
  try {
    await trySupabase(() =>
      supabase.from("plan")
        .upsert(row, { onConflict: "day" })
        .select()
        .single()
    );
    return { ok: true };
  } catch (e) {
    const box = loadOutbox();
    box.push({ type: "plan", payload: row });
    saveOutbox(box);
    return { ok: false, queued: true, error: String(e.message || e) };
  }
}

export async function fetchPlanRange(dayFrom, dayTo) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const { data, error } = await supabase
      .from("plan")
      .select("day,payload")
      .gte("day", dayFrom)
      .lte("day", dayTo);
    if (error) throw error;
    const map = {};
    for (const r of data || []) map[r.day] = r.payload || {};
    return { ok: true, map };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

// --- Flush outbox (appelé au boot + quand on repasse online)
export async function flushOutbox() {
  if (!supabase) return;
  const box = loadOutbox();
  if (!box.length) return;

  const rest = [];
  for (const job of box) {
    try {
      if (job.type === "report") {
        await trySupabase(() =>
          supabase.from("reports").insert(job.payload).select().single()
        );
      } else if (job.type === "plan") {
        await trySupabase(() =>
          supabase.from("plan")
            .upsert(job.payload, { onConflict: "day" })
            .select()
            .single()
        );
      } else {
        // inconnu ⇒ on jette
      }
    } catch {
      // échec ⇒ on garde pour la prochaine fois
      rest.push(job);
    }
  }
  saveOutbox(rest);
}
