import { supabase } from './supabaseClient';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function getMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, team_id')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return { user, profile: data };
}
