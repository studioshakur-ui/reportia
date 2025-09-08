// src/lib/supabase.js
// -------------------------------------------------------------
// Supabase client + Sync "cloud-first / offline-ready"
// Tables attendues :
//
// plan(day date primary key, payload jsonb, updated_at timestamptz default now())
// workers(id text primary key, name text, role text, active boolean default true, updated_at timestamptz default now())
// tasks(id text primary key, label text, default_team_size int, updated_at timestamptz default now())
// impianti(id text primary key, label text, updated_at timestamptz default now())
// activities(id text primary key, label text, updated_at timestamptz default now())
// status(id text primary key default 'global', payload jsonb, updated_at timestamptz default now())
// reports(id uuid primary key, date date, capo text, plant text, payload jsonb, updated_at timestamptz default now())
//
// Variables Netlify : VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// -------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
try {
  if (!URL || !KEY) {
    console.warn("[supabase] Vars manquantes → mode offline-only.");
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

// ------------------- OUTBOX OFFLINE --------------------------
const OUTBOX_KEY = "planner.outbox.v1";
const readOutbox = () => {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch { return []; }
};
const writeOutbox = (list) => {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list)); } catch {}
};

function queue(job) {
  const list = readOutbox();
  list.push(job);
  writeOutbox(list);
}

async function executeJob(job) {
  if (!supabase) throw new Error("No supabase client");

  switch (job.type) {
    case "insert-report": {
      const { error } = await supabase.from("reports").insert(job.row);
      if (error) throw error; return;
    }
    case "upsert-plan-day": {
      const { day, payload } = job;
      const { error } = await supabase
        .from("plan")
        .upsert({ day, payload, updated_at: new Date().toISOString() }, { onConflict: "day" });
      if (error) throw error; return;
    }
    case "replace-workers": {
      const { list } = job;
      let { error } = await supabase.from("workers").delete().neq("id", "___none___");
      if (error) throw error;
      if (list.length) {
        ({ error } = await supabase.from("workers").insert(list));
        if (error) throw error;
      }
      return;
    }
    case "replace-catalog": {
      const { tasks = [], impianti = [], activities = [] } = job;

      let r = await supabase.from("tasks").delete().neq("id", "___none___");
      if (r.error) throw r.error;
      if (tasks.length) {
        r = await supabase.from("tasks").insert(tasks);
        if (r.error) throw r.error;
      }

      r = await supabase.from("impianti").delete().neq("id", "___none___");
      if (r.error) throw r.error;
      if (impianti.length) {
        r = await supabase.from("impianti").insert(impianti);
        if (r.error) throw r.error;
      }

      r = await supabase.from("activities").delete().neq("id", "___none___");
      if (r.error) throw r.error;
      if (activities.length) {
        r = await supabase.from("activities").insert(activities);
        if (r.error) throw r.error;
      }
      return;
    }
    case "save-status": {
      const { payload } = job;
      const { error } = await supabase
        .from("status")
        .upsert({ id: "global", payload, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) throw error; return;
    }
    default:
      throw new Error("Unknown job type: " + job.type);
  }
}

async function runOrQueue(job) {
  if (!supabase) { queue(job); return { queued: true }; }
  try { await executeJob(job); return { ok: true }; }
  catch (e) { queue(job); return { queued: true, error: e }; }
}

export async function flushOutbox() {
  if (!supabase) return;
  const list = readOutbox();
  if (!list.length) return;
  const next = [];
  for (const job of list) {
    try { await executeJob(job); }
    catch { next.push(job); }
  }
  writeOutbox(next);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flushOutbox);
}

// ---------------------- RAPPORTS -----------------------------
export async function saveReport(row) {
  return runOrQueue({ type: "insert-report", row });
}

// ------------------------ PLAN ------------------------------
export async function fetchPlan({ start, end }) {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("plan")
    .select("*")
    .gte("day", start)
    .lte("day", end);
  if (error) throw error;
  const out = {};
  for (const row of data || []) out[row.day] = row.payload || {};
  return out;
}

export async function upsertDayPlan(day, payload) {
  return runOrQueue({ type: "upsert-plan-day", day, payload });
}

// ----------------------- WORKERS ----------------------------
export async function fetchWorkers() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function replaceWorkers(list) {
  return runOrQueue({ type: "replace-workers", list });
}

// ----------------------- CATALOGUE --------------------------
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

// ------------------------- STATUS ---------------------------
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

// ----------------------- REALTIME ---------------------------
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
    try { supabase.removeChannel(channel); } catch {}
  };
}// A exécuter au retour online (ou au boot)
export async function flushOutbox() {
  if (!supabase) return; // pas de client, on ne flush pas
  const list = readOutbox();
  if (!list.length) return;
  const next = [];
  for (const job of list) {
    try {
      await executeJob(job);
    } catch {
      next.push(job);
    }
  }
  writeOutbox(next);
}

// Interprétation des jobs
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
      const { error } = await supabase
        .from("plan")
        .upsert({ day, payload, updated_at: new Date().toISOString() }, { onConflict: "day" });
      if (error) throw error;
      return;
    }
    case "replace-workers": {
      // Stratégie simple : purge puis insert
      const { list } = job;
      let { error } = await supabase.from("workers").delete().neq("id", "___none___");
      if (error) throw error;
      if (list.length) {
        ({ error } = await supabase.from("workers").insert(list));
        if (error) throw error;
      }
      return;
    }
    case "replace-catalog": {
      const { tasks = [], impianti = [], activities = [] } = job;

      // purge/insert 3 tables
      let res = await supabase.from("tasks").delete().neq("id", "___none___");
      if (res.error) throw res.error;
      if (tasks.length) {
        res = await supabase.from("tasks").insert(tasks);
        if (res.error) throw res.error;
      }

      res = await supabase.from("impianti").delete().neq("id", "___none___");
      if (res.error) throw res.error;
      if (impianti.length) {
        res = await supabase.from("impianti").insert(impianti);
        if (res.error) throw res.error;
      }

      res = await supabase.from("activities").delete().neq("id", "___none___");
      if (res.error) throw res.error;
      if (activities.length) {
        res = await supabase.from("activities").insert(activities);
        if (res.error) throw res.error;
      }
      return;
    }
    case "save-status": {
      const { payload } = job;
      const { error } = await supabase
        .from("status")
        .upsert({ id: "global", payload, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) throw error;
      return;
    }
    default:
      throw new Error("Unknown job type: " + job.type);
  }
}

// Flush auto quand on repasse online
if (typeof window !== "undefined") {
  window.addEventListener("online", flushOutbox);
}

// ---------------------- API RAPPORTS -------------------------
export async function saveReport(row) {
  // Essaye cloud, sinon outbox
  return runOrQueue({ type: "insert-report", row });
}

// ---------------------- API PLAN -----------------------------
export async function fetchPlan({ start, end }) {
  if (!supabase) return {}; // offline: l'app prendra le cache local
  const { data, error } = await supabase
    .from("plan")
    .select("*")
    .gte("day", start)
    .lte("day", end);
  if (error) throw error;
  const out = {};
  for (const row of data || []) out[row.day] = row.payload || {};
  return out;
}

export async function upsertDayPlan(day, payload) {
  return runOrQueue({ type: "upsert-plan-day", day, payload });
}

// ---------------------- API WORKERS --------------------------
export async function fetchWorkers() {
  if (!supabase) return null; // null = laisse l'app utiliser local
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function replaceWorkers(list) {
  return runOrQueue({ type: "replace-workers", list });
}

// ---------------------- API CATALOGUE ------------------------
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

// ---------------------- API STATUS ---------------------------
export async function fetchStatus() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("status").select("*").eq("id", "global").maybeSingle();
  if (error) throw error;
  return data?.payload || {};
}

export async function saveStatus(payload) {
  return runOrQueue({ type: "save-status", payload });
}

// ---------------------- REALTIME -----------------------------
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
    try { supabase.removeChannel(channel); } catch {}
  };
}
