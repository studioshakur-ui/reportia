import { useEffect, useState } from 'react';
import { fetchReportsByStatus, updateStatusServer } from '../services/reportService.js';

export default function Rapportini() {
  const [status, setStatus] = useState('submitted');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await fetchReportsByStatus(status, date || undefined);
      setRows(data);
    } catch { setMsg('Errore caricamento.'); }
    setLoading(false);
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [status, date]);

  async function act(id, a) {
    try { await updateStatusServer(id, a==='approve'?'approved':'rejected'); setMsg('Ok.'); await load(); }
    catch { setMsg('Errore azione.'); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-md border px-3 py-2 bg-white/80 dark:bg-zinc-900/50">
          <option value="submitted">Da validare</option>
          <option value="approved">Approvati</option>
          <option value="rejected">Rifiutati</option>
          <option value="all">Tutti</option>
        </select>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="rounded-md border px-3 py-2 bg-white/80 dark:bg-zinc-900/50"/>
      </div>
      {loading ? <p>Caricamento…</p> : rows.length===0 ? <p>Nessun rapportino.</p> : (
        <ul className="grid gap-2">
          {rows.map(r=>(
            <li key={r.id} className="rounded-xl border p-3 bg-white/80 dark:bg-zinc-900/50 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.date} — CN {r.cn || '-'}</div>
                <div className="text-xs opacity-75">Ore: {r.hours_total || 0} — Stato: {r.status}</div>
              </div>
              {status==='submitted' ? (
                <div className="flex gap-2">
                  <button onClick={()=>act(r.id,'approve')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Approva</button>
                  <button onClick={()=>act(r.id,'reject')} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">Rifiuta</button>
                </div>
              ) : <span className="text-xs opacity-70">ID {r.id.slice(0,8)}…</span>}
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </div>
  );
}
