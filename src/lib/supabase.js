// src/lib/supabase.js
import { supabase } from './supabaseClient.js';

/* ============ Auth ============ */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/* ============ Workers (operai) ============ */
export async function upsertWorkers(workers) {
  const { data, error } = await supabase
    .from('workers')
    .upsert(workers, { onConflict: 'matricola' })
    .select();
  if (error) throw error;
  return data;
}

export async function listWorkers() {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('cognome', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listCapi() {
  const { data, error } = await supabase
    .from('workers')
    .select('capo')
    .not('capo', 'is', null)
    .neq('capo', '')
    .order('capo', { ascending: true });
  if (error) throw error;
  return [...new Set(data.map(x => x.capo))];
}

/* ============ Rapportini ============ */
export async function saveRapportino(rapportino) {
  const { data, error } = await supabase
    .from('rapportini')
    .insert([rapportino])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function listRapportiniByCapo(capo) {
  const { data, error } = await supabase
    .from('rapportini')
    .select('*')
    .eq('capo', capo)
    .order('data', { ascending: false });
  if (error) throw error;
  return data;
}

export async function validateRapportino(id, manager) {
  const { data, error } = await supabase
    .from('rapportini')
    .update({ validato_da: manager, stato: 'validato' })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}
