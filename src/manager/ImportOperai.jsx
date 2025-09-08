// src/manager/ImportOperai.jsx
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { readSpreadsheet, normalizeOperaioRow } from '../lib/xlsxImport.js';

export default function ImportOperai() {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [invalid, setInvalid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    setDone(null); setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const raw = await readSpreadsheet(f);
      const ok = [];
      const bad = [];
      raw.forEach(r => {
        const n = normalizeOperaioRow(r);
        if (n.__invalid) bad.push(n);
        else ok.push(n);
      });
      setRows(ok);
      setInvalid(bad);
    } catch (err) {
      console.error(err);
      setError('Errore di lettura file. Verifica il formato.');
    } finally {
      setLoading(false);
    }
  }

  async function pushToDb() {
    if (!rows.length) return;
    setLoading(true); setError(null); setDone(null);

    // upsert su tabella "workers" (schema: id UUID default, matricola unique, nome, cognome, ruolo, capo, squadra, telefono, note, created_at)
    try {
      // Valide univocità matricola
      const payload = rows.map(r => ({
        matricola: String(r.matricola),
        nome: r.nome,
        cognome: r.cognome,
        ruolo: r.ruolo,
        capo: r.capo,
        squadra: r.squadra,
        telefono: r.telefono,
        note: r.note,
      }));

      // Chunk de 500 max pour rester safe
      const chunkSize = 500;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const slice = payload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('workers')
          .upsert(slice, { onConflict: 'matricola' }); // ⚠️ assure un indice UNIQUE sur 'matricola'
        if (error) throw error;
      }

      setDone(`Import completato: ${payload.length} operai salvati.`);
      setRows([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Errore scrittura database.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Importa dati operai</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn btn-secondary"
            disabled={loading}
          >
            Seleziona file (.xlsx, .csv)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
          <button
            onClick={pushToDb}
            className="btn btn-primary"
            disabled={loading || !rows.length}
            title={!rows.length ? 'Nessun dato da importare' : 'Importa su database'}
          >
            Importa su database
          </button>
        </div>
      </div>

      <div className="card-body">
        {loading && <p className="text-text-muted">Caricamento…</p>}
        {error && <p className="error">Errore: {error}</p>}
        {done && <p className="badge badge-success">{done}</p>}

        {!loading && !rows.length && !error && (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <p>Seleziona un file Excel/CSV per importare gli operai.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th>Matricola</th>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>Ruolo</th>
                  <th>Capo</th>
                  <th>Squadra</th>
                  <th>Telefono</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className="tr">
                    <td>{r.matricola}</td>
                    <td>{r.nome}</td>
                    <td>{r.cognome}</td>
                    <td><span className="badge badge-info">{r.ruolo}</span></td>
                    <td>{r.capo || '—'}</td>
                    <td>{r.squadra || '—'}</td>
                    <td>{r.telefono || '—'}</td>
                    <td>{r.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <p className="text-xs text-text-muted mt-2">Mostrando i primi 200 / {rows.length} righe…</p>
            )}
          </div>
        )}

        {invalid.length > 0 && (
          <div className="mt-6">
            <p className="badge badge-warn">Righe scartate: {invalid.length}</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-text-muted">
              {invalid.slice(0, 10).map((r, i) => (
                <li key={i}>Motivo: {r.motivo}</li>
              ))}
              {invalid.length > 10 && <li>…</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

