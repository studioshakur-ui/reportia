import { supabase } from '../lib/supabaseClient.js';
import { enqueue } from '../lib/offline.js';

export async function getCapis() {
  const { data, error } = await supabase.from('users').select('id, full_name').eq('role','capo');
  if (error) throw error; return data || [];
}
export async function getOperai() {
  const { data, error } = await supabase.from('users').select('id, full_name').eq('role','operaio');
  if (error) throw error; return data || [];
}
export async function fetchRosterForWeek(week_start) {
  const { data: ro, error } = await supabase.from('rosters').select('id, capo_id, team_id').eq('week_start', week_start);
  if (error) throw error;
  const rosterIds = (ro||[]).map(r => r.id);
  let membersMap = {};
  if (rosterIds.length) {
    const { data: mem, error: e2 } = await supabase.from('roster_members').select('roster_id, worker_id').in('roster_id', rosterIds);
    if (e2) throw e2;
    (mem||[]).forEach(m => { (membersMap[m.roster_id] ||= []).push(m.worker_id); });
  }
  // On renvoie { capo_id, team_id, members }
  const out = [];
  for (const r of (ro||[])) out.push({ capo_id: r.capo_id, team_id: r.team_id, members: membersMap[r.id] || [] });
  return out;
}

export async function saveRoster(week_start, list) {
  // On file des jobs "upsert_roster"; côté edge, créer/maj roster + membres
  for (const r of list) {
    await enqueue({ t: 'upsert_roster', payload: { week_start, capo_id: r.capo_id, team_id: r.team_id || null, members: r.members || [] } });
  }
}
