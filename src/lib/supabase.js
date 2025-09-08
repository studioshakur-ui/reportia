// src/lib/supabase.js
// Modulo unico per Supabase: init, auth, DB helpers, realtime, storage.
// Tutto in italiano (commenti) per coerenza del progetto.

import { createClient } from "@supabase/supabase-js";

/* =========================
 * Config & Singleton
 * ======================= */

let _sb = null;

function requiredEnv(name) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Variabile ambiente mancante: ${name}`);
  return v;
}

/** Crea/ritorna il client Supabase (singleton) */
export function supabase() {
  if (_sb) return _sb;
  const url = requiredEnv("VITE_SUPABASE_URL");
  const key = requiredEnv("VITE_SUPABASE_ANON_KEY");

  _sb = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // evita redirect loop su mobile
    },
    global: {
      headers: {
        "x-client-info": "reportia-web",
      },
    },
  });

  return _sb;
}

/* =========================
 * Utilità errori / retry
 * ======================= */

/** Normalizza un errore Supabase o JS in un oggetto semplice */
function normalizeError(e) {
  if (!e) return null;
  if (typeof e === "string") return { message: e };
  if (e.message) return { message: e.message, details: e.details, hint: e.hint, code: e.code };
  return { message: JSON.stringify(e) };
}

/** Retry con backoff lineare (semplice e sufficiente per rete mobile) */
async function withRetry(fn, { attempts = 2, delayMs = 300 } = {}) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/* =========================
 * Auth
 * ======================= */

/** Ritorna la sessione attuale senza bloccare il rendering */
export async function getSessionSafe() {
  try {
    const { data, error } = await supabase().auth.getSession();
    if (error) throw error;
    return data?.session ?? null;
  } catch (e) {
    console.warn("auth.getSession fallita:", e);
    return null;
  }
}

/** Magic link / OTP via email (passwordless) */
export async function signInWithEmailLink(email) {
  const { data, error } = await supabase().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window?.location?.origin || undefined,
    },
  });
  if (error) throw error;
  return data;
}

/** Logout sicuro */
export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
  return true;
}

/* =========================
 * DB Helpers generici (RLS compliant)
 * ======================= */

/**
 * Selettore generico.
 * @param {string} table - nome tabella
 * @param {string|string[]} columns - colonne, default "*"
 * @param {(q: import('@supabase/supabase-js').SupabaseQueryBuilder)=>any} whereFn - funzione che riceve il query builder per filtri/ordini
 */
export async function dbSelect(table, columns = "*", whereFn = null) {
  return withRetry(async () => {
    let q = supabase().from(table).select(columns);
    if (typeof whereFn === "function") q = whereFn(q) || q;
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  });
}

/** Insert generico */
export async function dbInsert(table, rows, { returning = "representation" } = {}) {
  const { data, error } = await supabase().from(table).insert(rows).select(returning);
  if (error) throw error;
  return data;
}

/** Upsert generico (necessita chiave unica o PK) */
export async function dbUpsert(table, rows, { onConflict, returning = "representation" } = {}) {
  let q = supabase().from(table).upsert(rows).select(returning);
  if (onConflict) q = q.onConflict(onConflict);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/** Update generico (servono filtri!) */
export async function dbUpdate(table, patch, whereFn) {
  let q = supabase().from(table).update(patch);
  if (typeof whereFn === "function") q = whereFn(q) || q;
  const { data, error } = await q.select();
  if (error) throw error;
  return data;
}

/** Delete generico (servono filtri!) */
export async function dbDelete(table, whereFn) {
  let q = supabase().from(table).delete();
  if (typeof whereFn === "function") q = whereFn(q) || q;
  const { data, error } = await q.select();
  if (error) throw error;
  return data;
}

/** RPC (funzione SQL) */
export async function dbRpc(fnName, params = {}) {
  const { data, error } = await supabase().rpc(fnName, params);
  if (error) throw error;
  return data;
}

/* =========================
 * Realtime (Postgres Changes)
 * ======================= */

/**
 * Sottoscrizione realtime ad una tabella.
 * @param {string} table - nome tabella
 * @param {(payload)=>void} onChange - callback per insert/update/delete
 * @returns {() => void} unsubscribe
 */
export function subscribeTable(table, onChange) {
  const channel = supabase().channel(`table:${table}`, {
    config: {
      broadcast: { self: false },
      presence: { key: "web" },
    },
  });

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table },
    (payload) => {
      try { onChange?.(payload); } catch (e) { console.error(e); }
    }
  );

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(`[realtime] subscribed -> ${table}`);
    }
  });

  return () => {
    supabase().removeChannel(channel);
  };
}

/* =========================
 * Storage (upload + URL pubblica)
 * ======================= */

/**
 * Carica un file su uno storage bucket e ritorna la public URL.
 * Necessita che il bucket abbia la policy "read: anon".
 * @param {string} bucket - nome bucket (es. "public")
 * @param {string} path - percorso nel bucket (es. "ships/seaside.jpg")
 * @param {File|Blob} file - contenuto
 */
export async function storageUploadPublic(bucket, path, file) {
  // upload con sovrascrittura
  const { error: upErr } = await supabase().storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (upErr) throw upErr;

  // genera URL pubblica
  const { data } = supabase().storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl;
}

/* =========================
 * Helper specifici per Reportia
 * ======================= */

/** Legge le navi (Monfalcone) ordinate per anno */
export async function shipsList() {
  return dbSelect("ships", "*", (q) => q.order("year", { ascending: true }));
}

/**
 * Verifica assegnazione giornata per un utente/capo
 * (Sostituisci con il tuo schema esatto)
 */
export async function isDayAssigned({ dateISO, capoUserId }) {
  const rows = await dbSelect("assignments", "id", (q) =>
    q.eq("day", dateISO).eq("capo_id", capoUserId).limit(1)
  );
  return rows.length > 0;
}

/** Seed di una assegnazione (solo per test) */
export async function seedAssignmentToday({ teamId, capoUserId }) {
  const today = new Date().toISOString().slice(0, 10);
  return dbUpsert(
    "assignments",
    [{ day: today, team_id: teamId, capo_id: capoUserId }],
    { onConflict: "day,capo_id" }
  );
}

/* =========================
 * Esempi d’uso (commentati)
 * ======================= */
/*
import { useEffect } from "react";
import { shipsList, subscribeTable } from "./supabase";

useEffect(() => {
  shipsList().then(console.log);

  const unsub = subscribeTable("ships", (payload) => {
    console.log("Cambio ships:", payload.eventType, payload.new);
  });
  return () => unsub();
}, []);
*/
