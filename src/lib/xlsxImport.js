// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';
// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';

/**
 * Lit un fichier Excel/CSV et retourne un objet { name, headers, rowsRaw }.
 */
export async function smartReadWorkers(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const headers = Object.keys(json[0] || {});

        resolve({
          name: sheetName,
          headers,
          rowsRaw: json,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normalise les données Excel → format attendu par la DB.
 * Retourne { ok: [], bad: [] }.
 */
export function normalizeWorkers(rows, { allowAutoMatricola = true, uniqueByNomeCognome = true } = {}) {
  const seen = new Set();
  const ok = [];
  const bad = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const nome = (raw.Nome || raw.nome || '').trim();
    const cognome = (raw.Cognome || raw.cognome || '').trim();
    let matricola = (raw.Matricola || raw.matricola || '').toString().trim();

    if (!nome || !cognome) {
      bad.push({ __raw: raw, motivo: 'Nome o cognome mancanti' });
      continue;
    }

    if (!matricola) {
      if (allowAutoMatricola) {
        matricola = `AUTO-${i + 1}`;
      } else {
        bad.push({ __raw: raw, motivo: 'Matricola mancante' });
        continue;
      }
    }

    const key = uniqueByNomeCognome ? `${nome}_${cognome}` : matricola;
    if (seen.has(key)) {
      bad.push({ __raw: raw, motivo: 'Duplicato' });
      continue;
    }
    seen.add(key);

    ok.push({
      matricola,
      nome,
      cognome,
      ruolo: raw.Ruolo || raw.ruolo || 'operaio',
      capo: raw.Capo || raw.capo || '',
      squadra: raw.Squadra || raw.squadra || '',
      telefono: raw.Telefono || raw.telefono || '',
      note: raw.Note || raw.note || '',
    });
  }

  return { ok, bad };
}
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

