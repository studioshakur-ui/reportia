// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';

/* ---------- Utils ---------- */
function slug(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '');
}

const NON_PERSON_KEYWORDS = [
  'carpenteria','magazzino','ufficio','ferie','assenze',
  'reparto','squadra','team','impianto','vari','varie','note','totale'
];

function looksLikePerson(s) {
  if (!s) return false;
  const t = String(s).trim();
  if (!/[A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+/.test(t)) return false;
  const low = t.toLowerCase();
  if (NON_PERSON_KEYWORDS.some(k => low.includes(k))) return false;
  return true;
}

function splitNominativo(v) {
  const t = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return { nome: null, cognome: null };
  const parts = t.split(' ');
  if (parts.length === 1) return { nome: parts[0], cognome: '' };
  const first = parts[0], rest = parts.slice(1).join(' ');
  const isUpper = first === first.toUpperCase();
  return isUpper ? { cognome: first, nome: rest } : { nome: first, cognome: rest };
}

export function makeMatricola(nome, cognome) {
  const base = slug(`${nome || ''}-${cognome || ''}`) || 'op';
  const s = Date.now().toString(36).slice(-4);
  return `${base}-${s}`;
}

/* ---------- Lecture classeur avec auto-détection ---------- */
export async function smartReadWorkers(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const preferred = ['ElencoDIPxCONVALIDA', 'ELENCODIPXCONVALIDA', 'Foglio1', 'Programma', 'PROGRAMMA'];
  const list = [...preferred, ...wb.SheetNames];

  for (const name of list) {
    const ws = wb.Sheets[name];
    if (!ws) continue;

    // matrice brute pour heuristiques (évite _EMPTY_xx)
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    if (!matrix || !matrix.length) continue;

    const headerRow = matrix.find(r => Array.isArray(r) && r.some(c => String(c||'').trim() !== '')) || [];
    const headers = headerRow.map(h => String(h || '').trim());
    const hasNominativo = headers.some(h => slug(h).includes('nominativo'));
    const hasNameCols =
      headers.some(h => slug(h) === 'nome') &&
      headers.some(h => slug(h) === 'cognome');

    if (hasNominativo || hasNameCols) {
      const rowsRaw = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
      return { name, headers, rowsRaw, matrix };
    }
  }

  // Fallback: première feuille
  const first = wb.SheetNames[0];
  const ws = wb.Sheets[first];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const rowsRaw = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
  const headers = Object.keys(rowsRaw[0] || {});
  return { name: first, headers, rowsRaw, matrix };
}

/* ---------- Normalisation + détection des groupes Capo ---------- */

const MAP = {
  nome:       ['nome','name','first_name','operatore','operaio'],
  cognome:    ['cognome','last_name','cogn'],
  nominativo: ['nominativo','nominativo_da_programma','operatore','dipendente','intestatario'],
  matricola:  ['matricola','badge','id','codice','matr','id_persona','id_operatore'],
  ruolo:      ['ruolo','mansione','role','qualifica'],
  capo:       ['capo','capo_squadra','caposquadra','responsabile'],
  squadra:    ['squadra','team','gruppo','reparto'],
  telefono:   ['telefono','tel','phone','cell','cellulare'],
  note:       ['note','notes','osservazioni'],
};

function findValue(row, keys, overrides = null) {
  if (overrides) {
    for (const to in overrides) {
      if (overrides[to] && keys.includes(to) && row[overrides[to]] != null) {
        return row[overrides[to]];
      }
    }
  }
  const keyset = Object.keys(row);
  for (const k of keys) {
    if (row[k] != null) return row[k];
    const sk = slug(k);
    for (const real of keyset) {
      const rslug = slug(real);
      if (rslug === sk || rslug.startsWith(sk)) return row[real];
    }
  }
  return null;
}

/** Déduit les groupes Capo depuis la matrice brute */
function inferCapoByMatrix(matrix) {
  const capiByRowIndex = new Map();
  let currentCapo = null;

  let start = 0;
  while (start < matrix.length && (!matrix[start] || matrix[start].every(v => v == null || String(v).trim() === ''))) {
    start++;
  }

  for (let i = start; i < matrix.length; i++) {
    const row = matrix[i] || [];
    const clean = row.map(x => (x == null ? '' : String(x).trim()));
    const nonEmpty = clean.filter(Boolean);

    if (nonEmpty.length === 0) {
      currentCapo = null;
      continue;
    }

    if (nonEmpty.length === 1 && looksLikePerson(nonEmpty[0])) {
      currentCapo = nonEmpty[0];
      capiByRowIndex.set(i, currentCapo);
      continue;
    }

    if (currentCapo) {
      capiByRowIndex.set(i, currentCapo);
    }
  }

  return capiByRowIndex; // index de ligne → "Mario Rossi"
}

/**
 * rowsRaw : JSON ligne par ligne
 * options.overrides : mapping manuel { nome: 'ColonnaX', cognome:'ColonnaY', ... }
 */
export function normalizeWorkers(
  rowsRaw,
  {
    allowAutoMatricola = true,
    uniqueByNomeCognome = true,
    matrixForCapo = null,
    overrides = null,
  } = {}
) {
  const ok = [];
  const bad = [];
  const seen = new Set();

  const capoIndex = Array.isArray(matrixForCapo) ? inferCapoByMatrix(matrixForCapo) : new Map();

  for (let i = 0; i < rowsRaw.length; i++) {
    const raw = rowsRaw[i];

    let nome = findValue(raw, MAP.nome, overrides);
    let cognome = findValue(raw, MAP.cognome, overrides);
    const nominativo = findValue(raw, MAP.nominativo, overrides);

    if ((!nome || !cognome) && looksLikePerson(nominativo)) {
      const s = splitNominativo(nominativo);
      if (!nome) nome = s.nome;
      if (!cognome) cognome = s.cognome;
    }

    nome = nome ? String(nome).trim() : null;
    cognome = cognome ? String(cognome).trim() : '';

    if (!nome || !looksLikePerson(`${nome} ${cognome}`)) {
      bad.push({ __invalid: true, motivo: 'non persona o nome mancante', __raw: raw });
      continue;
    }

    let matricola = findValue(raw, MAP.matricola, overrides);
    matricola = matricola != null ? String(matricola).trim() : null;
    if (!matricola && allowAutoMatricola) {
      matricola = makeMatricola(nome, cognome);
    }
    if (!matricola) {
      bad.push({ __invalid: true, motivo: 'matricola mancante', __raw: raw });
      continue;
    }

    const ruolo   = (findValue(raw, MAP.ruolo, overrides)   ?? 'operaio') + '';
    let   capo    = findValue(raw, MAP.capo, overrides);
    const squadra = findValue(raw, MAP.squadra, overrides);
    const tel     = findValue(raw, MAP.telefono, overrides);
    const note    = findValue(raw, MAP.note, overrides);

    if (!capo && capoIndex.has(i)) capo = capoIndex.get(i);

    const key = `${slug(nome)}|${slug(cognome)}`;
    if (uniqueByNomeCognome) {
      if (seen.has(key)) continue;
      seen.add(key);
    }

    ok.push({
      matricola,
      nome,
      cognome,
      ruolo,
      capo: capo || null,
      squadra: squadra || null,
      telefono: tel || null,
      note: note || null,
    });
  }

  return { ok, bad };
}
