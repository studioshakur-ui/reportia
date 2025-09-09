import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase, bootstrapError } from '../lib/supabaseClient';

export default function ImportOperai() {
  const [rows, setRows] = useState([]);
  const [invalid, setInvalid] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array', cellStyles: true });
      const ws = wb.Sheets[wb.SheetNames[0]];

      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const parsed = [];

      raw.forEach((line, idx) => {
        if (!line || line.length === 0) return;
        const capoCandidate = ws[`A${idx + 1}`];
        const isCapo = capoCandidate?.s?.fgColor;

        if (isCapo) {
          parsed.push({
            type: 'capo',
            name: line[0],
            matricola: line[1] || '',
          });
        } else {
          parsed.push({
            type: 'operaio',
            name: line[0],
            matricola: line[1] || '',
          });
        }
      });

      const invalidRows = parsed.filter(r => !r.name);
      const validRows = parsed.filter(r => r.name);

      setRows(validRows);
      setInvalid(invalidRows);
    } catch (err) {
      console.error('📂 File parse error:', err);
      setError(err.message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (bootstrapError) {
      setError(bootstrapError);
      return;
    }
    if (!rows.length) {
      setError('Nessun dato valido da caricare.');
      return;
    }
    setLoading(true);
    try {
      const { error: dbErr } = await supabase.from('workers').insert(rows);
      if (dbErr) throw dbErr;
      alert('✅ Operai importati!');
    } catch (err) {
      console.error('DB insert error', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Importa dati operai</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFile}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Caricamento…' : 'Importa su database'}
      </button>
      <div style={{ marginTop: 20 }}>
        <h3>Anteprima</h3>
        <ul>
          {rows.map((r, i) => (
            <li key={i}>
              [{r.type}] {r.name} ({r.matricola})
            </li>
          ))}
        </ul>
        {invalid.length > 0 && (
          <>
            <h4>Righe scartate: {invalid.length}</h4>
            <ul>
              {invalid.map((r, i) => (
                <li key={i}>Motivo: nome o matricola mancanti</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
  if (!supabase) {
  setError('Supabase non inizializzato. Controlla le variabili ambiente.');
  return;
  }
}
