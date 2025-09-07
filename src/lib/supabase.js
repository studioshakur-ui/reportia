// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(URL, KEY);

// ---------- Outbox (offline-first) ----------
const OUTBOX_KEY = 'planner.outbox.v1';
const readOutbox  = () => JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
const writeOutbox = (list) => localStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
export async function flushOutbox() {
  const list = readOutbox();
  if (!list.length) return;
  const next = [];
  for (const job of list) {
    try {
      if (job.type === 'upsert-plan') {
        const { error } = await supabase.from('plan_days').upsert(job.row);
        if (error) throw error;
      } else if (job.type === 'insert-report') {
        const { error } = await supabase.from('reports').insert(job.row);
        if (error) throw error;
      }
    } catch (e) {
      next.push(job); // on garde et on retentera plus tard
    }
  }
  writeOutbox(next);
}

// ---------- PLAN (table: plan_days) ----------
// Schéma conseillé:
// create table plan_days (day text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());

export async function fetchFullPlan() {
  const { data, error } = await supabase.from('plan_days').select('*');
  if (error) throw error;
  const plan = {};
  for (const r of data) plan[r.day] = r.data || {};
  return plan;
}

export function watchPlan(onUpsert) {
  // Realtime Postgres changes
  const ch = supabase
    .channel('plan-days')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'plan_days' },
      (payload) => {
        const row = payload.new || payload.old;
        // onUpsert(day, data)
        if (payload.eventType === 'DELETE') onUpsert(row.day, undefined);
        else onUpsert(row.day, (row.data || {}));
      })
    .subscribe();
  return () => supabase.removeChannel(ch);
}

export async function upsertPlanDay(day, data) {
  const row = { day, data, updated_at: new Date().toISOString() };
  // Optimistic: on tente, sinon outbox
  const { error } = await supabase.from('plan_days').upsert(row);
  if (error) {
    const list = readOutbox();
    list.push({ type: 'upsert-plan', row });
    writeOutbox(list);
  }
}

// ---------- REPORTS (table: reports) ----------
// Schéma conseillé:
// create table reports (id uuid primary key, date date not null, capo text, plant text, payload jsonb, updated_at timestamptz default now());

export async function saveReport(row) {
  const { error } = await supabase.from('reports').insert(row);
  if (error) {
    const list = readOutbox();
    list.push({ type: 'insert-report', row });
    writeOutbox(list);
  }
}

// Flush quand on repasse online
window.addEventListener('online', flushOutbox);
