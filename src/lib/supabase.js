// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const envOk = Boolean(url && key);
export const envSummary = {
  url,
  keyStartsWith: key ? key.slice(0, 4) : null,
  keyLen: key ? key.length : 0,
};

export const supabase = envOk ? createClient(url, key) : null;

export async function pingTestTable() {
  if (!supabase) return { ok: false, error: "missing-env" };
  try {
    const { data, error } = await supabase.from("test").select("*").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: data?.length ?? 0 };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function insertTestRow(name) {
  if (!supabase) return { ok: false, error: "missing-env" };
  try {
    const { data, error } = await supabase
      .from("test")
      .insert({ name })
      .select();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
