import { useState } from 'react';
import { parseExcel } from '../lib/excel.js';
import { supabase } from '../lib/supabaseClient.js';

export default function ImportDati() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setMsg('Parsing…');
    try {
      const { sheets } = await parseExcel(f);
      setRows(sheets[0]?.rows || []);
      setMsg(`Trovate ${sheets[0]?.rows?.length || 0} righe. Mappa le colonne e importa.`);
    } catch { setMsg('Errore parsing.'); }
  }

  async function importUsers() {
    // DEMO: suppose colonnes full_name, role
    if (!rows.length) { setMsg('Nessuna riga.'); return; }
    try {
      const payload = rows.map(r => ({ full_name: r.full_name, role: r.role || 'operaio' })).filter(x => x.full_name);
      // ICI: à adapter à TON schéma "users" (si table custom sinon gère via deux tables séparées)
      const { error } = await supabase.from('users').upsert(payload, { ignoreDuplicates: false });
      if (error) throw error;
      setMsg(`Import ok: ${payload.length} utenti.`);
    } catch (e) { setMsg('Errore import.'); }
  }

  return (
    <div className="space-y-3">
      <input type="file" accept=".xlsx,.xls" onChange={onFile} />
      <button onClick={importUsers} className="px-3 py-2 rounded-xl border">Importa utenti (demo)</button>
      {msg && <p className="text-sm opacity-80">{msg}</p>}
      {!!rows.length && (
        <div className="overflow-auto max-h-64 border rounded-xl">
          <table className="min-w-full text-sm">
            <thead><tr>{Object.keys(rows[0]).map(k=><th key={k} className="text-left p-2 border-b">{k}</th>)}</tr></thead>
            <tbody>
              {rows.slice(0,20).map((r,i)=>(
                <tr key={i}>{Object.keys(rows[0]).map(k=><td key={k} className="p-2 border-b">{String(r[k])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
