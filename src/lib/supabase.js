// src/lib/supabase.js
// -------------------------------------------------------------
// Supabase client + sync cloud-first (cache offline via outbox)
// Requiert: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Tables: plan, workers, tasks, impianti, activities, status, reports
// -------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// -------- Client --------
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
try {
  if (!URL || !KEY) {
    console.warn("[supabase] URL/KEY absentes → mode offline-only.");
  } else {
    supabase = createClient(URL, KEY, {
      auth: { persistSession: false },
      global: { headers: { "x-client-info": "reportia-app" } },
    });
  }
} catch (e) {
  console.error("[supabase] init error:", e);
  supabase = null;
}
export { supabase };

// -------- Outbox (offline) --------
const OUTBOX_KEY = "planner.outbox.v1";

function readOutbox() {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeOutbox(list) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
  } catch {}
}
function queue(job) {
  const l = readOutbox();
  l.push(job);
  writeOutbox(l);
}

async function executeJob(job) {
  if (!supabase) throw new Error("No supabase client");

  switch (job.type) {
    case "insert-report": {
      const { error } = await supabase.from("reports").insert(job.row);
      if (error) throw error;
      return;
    }
    case "upsert-plan-day": {
      const { day, payload } = job;
      const { error } = await supabase.from("plan").upsert(
        { day, payload, updated_at: new Date().toISOString() },
        { onConflict: "day" }
      );
      if (error) throw error;
      return;
    }
    case "replace-workers": {
      const { list } = job;
      let { error } = await supabase.from("workers").delete().neq("id", "___none___");
      if (error) throw error;
      if (list?.length) {
        ({ error } = await supabase.from("workers").insert(list));
        if (error) throw error;
      }
      return;
    }
    case "replace-catalog": {
      const { tasks = [], impianti = [], activities = [] } = job;
      for (const [table, rows] of [
        ["tasks", tasks],
        ["impianti", impianti],
        ["activities", activities],
      ]) {
        let r = await supabase.from(table).delete().neq("id", "___none___");
        if (r.error) throw r.error;
        if (rows.length) {
          r = await supabase.from(table).insert(rows);
          if (r.error) throw r.error;
        }
      }
      return;
    }
    case "save-status": {
      const { payload } = job;
      const { error } = await supabase.from("status").upsert(
        { id: "global", payload, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
      if (error) throw error;
      return;
    }
    default:
      throw new Error("Unknown job type: " + job.type);
  }
}

async function runOrQueue(job) {
  if (!supabase) {
    queue(job);
    return { queued: true };
  }
  try {
    await executeJob(job);
    return { ok: true };
  } catch (e) {
    queue(job);
    return { queued: true, error: e };
  }
}

export async function flushOutbox() {
  if (!supabase) return;
  const list = readOutbox();
  if (!list.length) return;
  const next = [];
  for (const j of list) {
    try {
      await executeJob(j);
    } catch {
      next.push(j);
    }
  }
  writeOutbox(next);
}
if (typeof window !== "undefined") {
  window.addEventListener("online", flushOutbox);
}

// -------- API Rapports --------
export async function saveReport(row) {
  return runOrQueue({ type: "insert-report", row });
}

// -------- API Plan --------
export async function fetchPlan({ start, end }) {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("plan")
    .select("*")
    .gte("day", start)
    .lte("day", end);
  if (error) throw error;
  const out = {};
  for (const r of data || []) out[r.day] = r.payload || {};
  return out;
}
export async function upsertDayPlan(day, payload) {
  return runOrQueue({ type: "upsert-plan-day", day, payload });
}

// -------- API Workers --------
export async function fetchWorkers() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("workers").select("*").order("name");
  if (error) throw error;
  return data || [];
}
export async function replaceWorkers(list) {
  return runOrQueue({ type: "replace-workers", list });
}

// -------- API Catalogue --------
export async function fetchCatalog() {
  if (!supabase) return null;
  const [t, i, a] = await Promise.all([
    supabase.from("tasks").select("*").order("label"),
    supabase.from("impianti").select("*").order("label"),
    supabase.from("activities").select("*").order("label"),
  ]);
  if (t.error) throw t.error;
  if (i.error) throw i.error;
  if (a.error) throw a.error;
  return {
    tasks: t.data || [],
    impianti: i.data || [],
    activities: a.data || [],
  };
}
export async function replaceCatalog({ tasks = [], impianti = [], activities = [] }) {
  return runOrQueue({ type: "replace-catalog", tasks, impianti, activities });
}

// -------- API Status --------
export async function fetchStatus() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("status")
    .select("*")
    .eq("id", "global")
    .maybeSingle();
  if (error) throw error;
  return data?.payload || {};
}
export async function saveStatus(payload) {
  return runOrQueue({ type: "save-status", payload });
}

// -------- Realtime --------
export function subscribePlan(onRow) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("realtime:plan")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "plan" },
      (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        onRow(row);
      }
    )
    .subscribe();
  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}
