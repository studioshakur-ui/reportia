// src/manager/ImportOperai.jsx
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { smartReadWorkers, normalizeWorkers } from '../lib/xlsxImport.js';

export default function ImportOperai() {
  const fileRef = useRef(null);
  const [sheet, setSheet] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [invalid, setInvalid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const [autoMatricola, setAutoMatricola] = useState(true);

  function onPick() { fileRef.current?.click(); }

  async function handleFile(e) {
    setDone(null); setError(null); setRows([]); setInvalid([]);
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const picked = await smartReadWorkers(f);
      setSheet(picked.name);
      setHeaders(picked.headers);

      const { ok, bad } = normalizeWorkers(picked.rowsRaw, {
        allowAutoMatricola: autoMatricola,
        uniqueByNomeCognome: true,
      });

      setRows(ok);
      setInvalid(bad);
    } catch (err) {
      console.error(err);
      setError('Errore di lettura file. Verifica il formato (.xlsx/.csv).');
    } finally {
      setLoading(false);
    }
  }

  async function pushToDb() {
  if (!rows.length) return;
  setLoading(true); setError(null); setDone(null);
  try {
    const payload = rows.map(r => ({
      matricola: r.matricola,
      nome: r.nome,
      cognome: r.cognome,
      ruolo: r.ruolo,
      capo: r.capo,
      squadra: r.squadra,
      telefono: r.telefono,
      note: r.note,
    }));

    const chunk = 400;
    for (let i = 0; i < payload.length; i += chunk) {
      const part = payload.slice(i, i + chunk);
      const { error } = await supabase
        .from('workers')
        .upsert(part, { onConflict: 'matricola' });
      if (error) throw error;
    }

    setDone(`Import completato: ${payload.length} operai salvati.`);
    setRows([]); setInvalid([]); setHeaders([]); setSheet('');
    if (fileRef.current) fileRef.current.value = '';
  catch (err) {
    console.error(err);
    setError(err.message || 'Errore scrittura database.');
  } finally {
    setLoading(false);
  }
}

  function downloadTemplate() {
    const csv = [
      'Matricola,Nome,Cognome,Ruolo,Squadra,Telefono,Note',
      '12345,Mario,Rossi,operaio,SQ1,3400000000,',
      '12346,Luca,Bianchi,operaio,SQ1,3400000001,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_operai.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadErrors() {
    if (!invalid.length) return;
    const header = ['motivo','raw'];
    const lines = invalid.map(x => [
      `"${(x.motivo||'').replace(/"/g,'""')}"`,
      `"${JSON.stringify(x.__raw || {}).replace(/"/g,'""')}"`,
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'righe_scartate.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Importa dati operai</h3>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={downloadTemplate}>
            Scarica template CSV
          </button>
          <button onClick={onPick} className="btn btn-secondary" disabled={loading}>
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
          >
            Importa su database
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Options */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoMatricola}
              onChange={(e)=>setAutoMatricola(e.target.checked)}
            />
            Genera automaticamente la matricola quando manca
          </label>

          {sheet && (
            <span className="badge badge-info">
              Foglio: {sheet}
            </span>
          )}
          {headers.length > 0 && (
            <span className="badge badge-info">
              Colonne rilevate: {headers.join(' · ')}
            </span>
          )}
        </div>

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
          <>
            <p className="text-sm mb-2">
              Pronte da importare: <strong>{rows.length}</strong>
            </p>
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
                  {rows.slice(0, 150).map((r, i) => (
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
              {rows.length > 150 && (
                <p className="text-xs text-text-muted mt-2">
                  Mostrando i primi 150 / {rows.length} righe…
                </p>
              )}
            </div>
          </>
        )}

        {invalid.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <p className="badge badge-warn">Righe scartate: {invalid.length}</p>
            <button className="btn btn-secondary" onClick={downloadErrors}>
              Scarica errori CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}      setRows([]);
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

