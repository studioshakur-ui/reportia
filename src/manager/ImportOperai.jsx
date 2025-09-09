// src/manager/ImportOperai.jsx
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { smartReadWorkers, normalizeWorkers } from '../lib/xlsxImport.js';

const DEFAULT_OVERRIDES = {
  nome: '', cognome: '', nominativo: '', matricola: '',
  ruolo: '', capo: '', squadra: '', telefono: '', note: '',
};

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
  const [pickedMatrix, setPickedMatrix] = useState(null);

  // mapping manuel (colonne → champ)
  const [overrides, setOverrides] = useState({ ...DEFAULT_OVERRIDES });
  const [showMapper, setShowMapper] = useState(false);

  function onPick() {
    fileRef.current?.click();
  }

  async function handleFile(e) {
    setDone(null);
    setError(null);
    setRows([]);
    setInvalid([]);
    setHeaders([]);
    setSheet('');
    setOverrides({ ...DEFAULT_OVERRIDES });
    setShowMapper(false);

    const f = e.target.files?.[0];
    if (!f) return;

    setLoading(true);
    try {
      const picked = await smartReadWorkers(f);
      setSheet(picked.name);
      setHeaders(picked.headers);
      setPickedMatrix(picked.matrix);

      const { ok, bad } = normalizeWorkers(picked.rowsRaw, {
        allowAutoMatricola: autoMatricola,
        uniqueByNomeCognome: true,
        matrixForCapo: picked.matrix,       // <- détection des groupes Capo
      });

      setRows(ok);
      setInvalid(bad);

      // Affiche le mapper si colonnes faibles (beaucoup d'EMPTY)
      const emptyish = picked.headers.filter(h => /^_?EMPTY/i
