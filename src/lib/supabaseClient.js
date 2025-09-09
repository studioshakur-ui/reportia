import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

function looksLikeServiceRole(k) {
  if (!k) return false;
  return k.toLowerCase().includes('service_role');
}

let supabase = null;

try {
  if (!url || !key) {
    console.error('🚨 Env mancante: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  } else if (looksLikeServiceRole(key)) {
    console.error('🚨 NON usare la chiave service_role nel browser!');
  } else {
    supabase = createClient(url, key);
    console.log('✅ Supabase client pronto');
  }
} catch (e) {
  console.error('💥 Errore init supabase', e);
  supabase = null;
}

export { supabase };
