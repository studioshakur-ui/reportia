// src/lib/xlsxImport.js
import * as XLSX from 'xlsx';

/**
 * Lecture intelligente d'un fichier Excel/CSV.
 * Retourne un objet { name, headers, rowsRaw }.
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
 * Normalisation des données Excel → format DB.
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
