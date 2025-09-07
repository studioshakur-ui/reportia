// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const OUTBOX_KEY = "planner.outbox.v1";
const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

function loadOutbox() {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch { return []; }
}
function saveOutbox(list) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
}
function pushOutbox(item) {
  const list = loadOutbox();
  list.push({ ...item, _ts: Date.now() });
  saveOutbox(list);
}

/* ---------------- Plans ---------------- */

export async function hydratePlan() {
  const { data, error } = await supabase.from("plans").select("*").order("day_key");
  if (error) { console.warn("hydratePlan error:", error.message); return {}; }
  const obj = {};
  for (const r of data) {
    obj[r.day_key] = {
      taskId: r.task_id || null,
      impiantoId: r.impianto_id || null,
      capoId: r.capo_id || "",
      team: Array.isArray(r.team) ? r.team : [],
    };
  }
  return obj;
}

export async function savePlanDay(dayKey, { taskId, impiantoId, capoId, team }) {
  const row = {
    day_key: dayKey,
    task_id: taskId || null,
    impianto_id: impiantoId || null,
    capo_id: capoId || null,
    team: team || [],
    updated_at: new Date().toISOString(),
  };

  if (!isOnline()) {
    pushOutbox({ type: "plan", row });
    return { ok: true, queued: true };
  }

  const { error } = await supabase.from("plans").upsert(row, { onConflict: "day_key" });
  if (error) {
    pushOutbox({ type: "plan", row });
    return { ok: false, queued: true, error: error.message };
  }
  return { ok: true };
}

export function subscribePlans(onRow) {
  const ch = supabase
    .channel("rt-plans")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "plans" },
      (payload) => {
        const r = payload.new || payload.old;
        if (!r) return;
        onRow(r.day_key, {
          taskId: r.task_id || null,
          impiantoId: r.impianto_id || null,
          capoId: r.capo_id || "",
          team: Array.isArray(r.team) ? r.team : [],
        });
      }
    )
    .subscribe();
  return () => { try { supabase.removeChannel(ch); } catch {} };
}

/* ---------------- Rapports ---------------- */

export async function saveReport(row) {
  // row = { id?, day_key, capo, plant, payload, updated_at }
  const payload = {
    id: row.id || crypto.randomUUID(),
    day_key: row.day_key,
    capo: row.capo || null,
    plant: row.plant || null,
    payload: row.payload || {},
    updated_at: row.updated_at || new Date().toISOString(),
  };

  if (!isOnline()) {
    pushOutbox({ type: "report", row: payload });
    return { ok: true, queued: true };
  }

  const { error } = await supabase.from("reports").insert(payload);
  if (error) {
    pushOutbox({ type: "report", row: payload });
    return { ok: false, queued: true, error: error.message };
  }
  return { ok: true };
}

/* ---------------- Outbox ---------------- */

export async function flushOutbox() {
  const list = loadOutbox();
  if (!list.length || !isOnline()) return { flushed: 0 };

  const rest = [];
  let okCount = 0;

  for (const item of list) {
    try {
      if (item.type === "plan") {
        const { error } = await supabase.from("plans").upsert(item.row, { onConflict: "day_key" });
        if (error) throw new Error(error.message);
        okCount++;
      } else if (item.type === "report") {
        const { error } = await supabase.from("reports").insert(item.row);
        if (error) throw new Error(error.message);
        okCount++;
      }
    } catch (e) {
      rest.push(item); // on retentera plus tard
    }
  }

  saveOutbox(rest);
  return { flushed: okCount, remaining: rest.length };
}
