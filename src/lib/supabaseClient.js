// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

function looksLikeServiceRole(k) {
  if (!k) return false;
  const low = String(k).toLowerCase();
  return low.includes('service_role') || low.includes('secret') || low.includes('priv');
}
if (looksLikeServiceRole(key)) {
  throw new Error('Forbidden use of secret API key in browser');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'reportia-auth' },
});
