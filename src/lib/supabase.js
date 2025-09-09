import { supabase } from './supabaseClient.js'

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signOut(){ const { error } = await supabase.auth.signOut(); if (error) throw error }
export async function getCurrentUser(){ const { data:{user}, error } = await supabase.auth.getUser(); if (error) throw error; return user }

export async function upsertWorkers(workers) {
  const { data, error } = await supabase.from('workers').upsert(workers, { onConflict: 'matricola' }).select()
  if (error) throw error
  return data
}
