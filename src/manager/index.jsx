// src/manager/index.jsx
import React, { useState } from 'react';
import ImportOperai from './ImportOperai.jsx';
import { supabase } from '../lib/supabaseClient.js';

function Validazione() {
  const [status, setStatus] = useState('submitted');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      let q = supabase.from('reports').select('id,date,capo_id,hours_total,status').order('date', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      if (date) q = q.eq('date', date);
      const { data, error } = await q;
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setErr(e.message || 'Errore caricamento.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []); // initial

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <select className="select w-40" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="submitted">Da validare</option>
            <option value="approved">Approvati</option>
            <option value="rejected">Respinti</option>
            <option value="all">Tutti</option>
          </select>
          <input className="input w-40" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Ricarica</button>
        </div>
      </div>
      <div className="card-body">
        {loading && <p className="text-text-muted">Caricamento…</p>}
        {err && <p className="error">Errore: {err}</p>}
        {!loading && rows.length === 0 && !err && (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <p>Nessun rapportino.</p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th>Data</th>
                  <th>Capo</th>
                  <th>Ore totali</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {rows.map(r => (
                  <tr key={r.id} className="tr">
                    <td>{r.date}</td>
                    <td>{r.capo_id || '—'}</td>
                    <td>{r.hours_total || 0}</td>
                    <td>
                      {r.status === 'submitted' && <span className="badge badge-warn">Da validare</span>}
                      {r.status === 'approved' && <span className="badge badge-success">Approvato</span>}
                      {r.status === 'rejected' && <span className="badge badge-danger">Respinto</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [tab, setTab] = useState('validazione');

  return (
    <div className="container-page">
      {/* Header lisible en light mode */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <h1>Naval Planner — Manager</h1>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={()=>{
              const el = document.documentElement;
              el.classList.toggle('dark');
              localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
            }}>
              Tema
            </button>
            <span className="sync-chip">Online</span>
          </div>
        </div>
        <div className="tabs mt-4">
          <button className={`tab ${tab==='validazione' ? 'tab-active' : ''}`} onClick={()=>setTab('validazione')}>Validazione</button>
          <button className={`tab ${tab==='import' ? 'tab-active' : ''}`} onClick={()=>setTab('import')}>Importa dati</button>
        </div>
      </div>

      {tab === 'validazione' && <Validazione />}
      {tab === 'import' && <ImportOperai />}
    </div>
  );
}
