// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';

/* -------------------- Utils -------------------- */
function slug(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '');
}

const NON_PERSON_KEYWORDS = [
  'carpenteria', 'magazzino', 'ufficio', 'ferie',
  'imp', 'impianto', 'reparto', 'squadra', 'team',
];

/* Heuristique: ligne ressemble à un nom/prénom ? */
function looksLikePerson(s) {
  if (!s) return false;
  const t = String(s).trim();
  if (!t) return false;
  // au moins un espace entre 2 mots alphabétiques
  if (!/[A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+/.test(t)) return false;
  // pas de mots-clés métier
  const tlow = t.toLowerCase();
  if (NON_PERSON_KEYWORDS.some(k => tlow.includes(k))) return false;
  return true;
}

/* Split "Cognome Nome" ou "Nome Cognome" */
function splitNominativo(v) {
  const t = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return { nome: null, cognome: null };
  const parts = t.split(' ');
  if (parts.length === 1) return { nome: parts[0], cognome: '' };
  const first = parts[0], rest = parts.slice(1).join(' ');
  const isUpper = first === first.toUpperCase();
  return isUpper ? { cognome: first, nome: rest } : { nome: first, cognome: rest };
}

/* Matricola auto (dépend du nom + date) */
export function makeMatricola(nome, cognome) {
  const base = slug(`${nome || ''}-${cognome || ''}`) || 'op';
  const s = Date.now().toString(36).slice(-4);
  return `${base}-${s}`;
}

/* -------------------- Lecture classeur -------------------- */
export async function smartReadWorkers(file) {
  // Retourne { sheet, headers, rowsRaw }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  // 1) trouver la sheet qui contient une colonne NOMINATIVO
  const pick = (names) => {
    for (const name of names) {
      const ws = wb.Sheets[name];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
      if (rows && rows.length) {
        const headers = Object.keys(rows[0] || {});
        const hasNominativo = headers.some(h => slug(h).includes('nominativo'));
        if (hasNominativo) return { name, headers, rowsRaw: rows };
      }
    }
    return null;
  };

  // Essais dans un ordre pertinent
  let picked =
    pick(['ElencoDIPxCONVALIDA', 'Foglio1', 'Tabella2', 'PROGRAMMA']) ||
    (() => {
      // fallback: n’importe quelle feuille contenant “nominativo”
      for (const name of wb.SheetNames) {
        const ws = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
        if (rows && rows.length) {
          const headers = Object.keys(rows[0] || {});
          const hasNominativo = headers.some(h => slug(h).includes('nominativo'));
          if (hasNominativo) return { name, headers, rowsRaw: rows };
        }
      }
      return null;
    })();

  // Vrai fallback: 1ʳᵉ feuille
  if (!picked) {
    const name = wb.SheetNames[0];
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
    picked = { name, headers: Object.keys(rows[0] || {}), rowsRaw: rows };
  }

  return picked;
}

/* -------------------- Normalisation -------------------- */
const MAP = {
  nome:       ['nome','name','first_name','operatore','operaio'],
  cognome:    ['cognome','last_name','cogn'],
  nominativo: ['nominativo','nominativo_da_programma','nominativo_da_elenco_convalida','operatore','dipendente'],
  matricola:  ['matricola','badge','id','codice','matr','id_persona','id_operatore'],
  ruolo:      ['ruolo','mansione','role','qualifica'],
  capo:       ['capo','capo_squadra','caposquadra','responsabile'],
  squadra:    ['squadra','team','gruppo','reparto'],
  telefono:   ['telefono','tel','phone','cell'],
  note:       ['note','notes','osservazioni']
};

function findValue(row, keys) {
  const keyset = Object.keys(row);
  for (const k of keys) {
    if (row[k] != null) return row[k];
    const sk = slug(k);
    for (const real of keyset) {
      if (slug(real) === sk) return row[real];
      // gestion entêtes composées: "NOMINATIVO DA PROGRAMMA"
      if (slug(real).startsWith(sk)) return row[real];
    }
  }
  return null;
}

/**
 * Transforme rowsRaw -> {ok[], bad[]}
 * - allowAutoMatricola: génère matricola si absente
 * - uniqueByNomeCognome: dédoublonne sur (nome,cognome)
 */
export function normalizeWorkers(rowsRaw, {
  allowAutoMatricola = true,
  uniqueByNomeCognome = true,
} = {}) {
  const ok = [];
  const bad = [];
  const seen = new Set();

  for (const raw of rowsRaw) {
    let nome = findValue(raw, MAP.nome);
    let cognome = findValue(raw, MAP.cognome);
    const nominativo = findValue(raw, MAP.nominativo);

    if ((!nome || !cognome) && looksLikePerson(nominativo)) {
      const s = splitNominativo(nominativo);
      if (!nome) nome = s.nome;
      if (!cognome) cognome = s.cognome;
    }

    nome = nome ? String(nome).trim() : null;
    cognome = cognome ? String(cognome).trim() : '';

    // Filtre lignes non-personnes (ex: "CARPENTIERIA")
    if (!nome || !looksLikePerson(`${nome} ${cognome}`)) {
      bad.push({ __invalid: true, motivo: 'non persona o nome mancante', __raw: raw });
      continue;
    }

    let matricola = findValue(raw, MAP.matricola);
    matricola = matricola != null ? String(matricola).trim() : null;
    if (!matricola && allowAutoMatricola) {
      matricola = makeMatricola(nome, cognome);
    }
    if (!matricola) {
      bad.push({ __invalid: true, motivo: 'matricola mancante', __raw: raw });
      continue;
    }

    const ruolo   = (findValue(raw, MAP.ruolo)   ?? 'operaio') + '';
    const capo    = findValue(raw, MAP.capo);
    const squadra = findValue(raw, MAP.squadra);
    const tel     = findValue(raw, MAP.telefono);
    const note    = findValue(raw, MAP.note);

    const key = `${slug(nome)}|${slug(cognome)}`;
    if (uniqueByNomeCognome) {
      if (seen.has(key)) continue;
      seen.add(key);
    }

    ok.push({
      nome, cognome, matricola, ruolo,
      capo: capo || null,
      squadra: squadra || null,
      telefono: tel || null,
      note: note || null,
    });
  }

  return { ok, bad };
}
