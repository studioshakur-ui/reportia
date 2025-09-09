import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

function looksLikeServiceRole(k) {
  if (!k) return false;
  const s = String(k).toLowerCase();
  return s.includes('service_role') || s.includes('secret') || s.includes('priv');
}

let supabase = null;
let bootstrapError = null;

try {
  if (!url || !key) {
    bootstrapError = 'Variabili ambiente mancanti: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.';
    console.error('🔑', bootstrapError, { url: !!url, key: !!key });
  } else if (looksLikeServiceRole(key)) {
    bootstrapError = 'Chiave proibita rilevata (service_role). Usa solo la chiave anon pubblica.';
    console.error('🔒', bootstrapError);
  } else {
    supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'reportia-auth'
      },
    });
    console.log('✅ Supabase client inizializzato');
  }
} catch (e) {
  bootstrapError = e?.message || String(e);
  console.error('💥 Supabase init crash:', e);
}

export { supabase, bootstrapError };
