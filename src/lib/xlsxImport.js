// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';

/**
 * Lecture générique d'un fichier Excel/CSV et retour des lignes normalisées.
 * Accepte .xlsx, .xls, .csv
 * @param {File|Blob} file
 * @returns {Promise<Array<Object>>} rows
 */
export async function readSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];
  // header:1 => premier rang = entêtes brutes
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  return rows;
}

/**
 * Mapping tolérant : accepte différentes colonnes italiennes.
 * Colonne attendues (au moins): nome, cognome, matricola.
 * Optionnelles: ruolo, capo, squadra, telefono, note
 */
export function normalizeOperaioRow(raw) {
  const get = (keys) => {
    for (const k of keys) {
      const v = raw[k] ?? raw[k?.toLowerCase?.()] ?? raw[k?.toUpperCase?.()];
      if (v != null && v !== '') return String(v).trim();
    }
    return null;
  };

  const nome = get(['nome', 'name', 'first_name', 'operatore', 'operaio']);
  const cognome = get(['cognome', 'last_name', 'cogn']);
  const matricola = get(['matricola', 'id', 'badge', 'codice']);
  const ruolo = get(['ruolo', 'mansione', 'role']);
  const capo = get(['capo', 'capo_squadra', 'caposquadra']);
  const squadra = get(['squadra', 'team', 'gruppo']);
  const telefono = get(['telefono', 'phone', 'tel']);
  const note = get(['note', 'notes']);

  if (!nome || !matricola) {
    return { __invalid: true, __raw: raw, motivo: 'nome o matricola mancanti' };
  }

  return {
    nome,
    cognome: cognome || '',
    matricola,
    ruolo: ruolo || 'operaio',
    capo: capo || null,
    squadra: squadra || null,
    telefono: telefono || null,
    note: note || null,
  };
}

