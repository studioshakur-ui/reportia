// src/lib/pdf.js
// npm i jspdf jspdf-autotable
import jsPDF from "jspdf";
import "jspdf-autotable";

/* --------------------- helpers --------------------- */
const IT_WEEKDAYS = ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
function formatDateNice(input) {
  const d = typeof input === "string" ? new Date(input) : input instanceof Date ? input : new Date();
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${IT_WEEKDAYS[d.getDay()]} ${dd}/${mm}/${yyyy}`;
}

function shapeRows(rows, workers, activities) {
  const wName = (id) => workers?.find(w=>w.id===id)?.name || id;
  const aLabel = (id) => activities?.find(a=>a.id===id)?.label || id || "";
  return rows.map(r => ({
    name: wName(r.id),
    hours: Number(r.hours)||0,
    activityLabel: r.activityLabel || aLabel(r.activityId),
    qtyDisplay: r.qtyDisplay || "",
    note: r.note || ""
  }));
}

/** Regroupe les binômes (ou +) qui partagent activité + heures + quantité + note */
function collapseBinomes(shaped) {
  const keyOf = (r) => JSON.stringify([r.activityLabel, r.hours, r.qtyDisplay, r.note]);
  const map = new Map();
  for (const r of shaped) {
    const k = keyOf(r);
    const entry = map.get(k) || { names: [], ...r };
    entry.names.push(r.name);
    map.set(k, entry);
  }
  return Array.from(map.values()).map(e => ({
    name: e.names.join("\n"),          // plusieurs opérateurs dans la même cellule
    hours: e.hours,
    activityLabel: e.activityLabel,
    qtyDisplay: e.qtyDisplay,
    note: e.note
  }));
}

function decoratePages(doc, { meta }) {
  const brand = [79,70,229]; // indigo-600
  const text  = [17,24,39];

  const pages = doc.getNumberOfPages();
  for (let i=1;i<=pages;i++){
    doc.setPage(i);

    // header
    doc.setFillColor(255,255,255);
    doc.rect(14,10,182,16,"F");

    doc.setFont("helvetica","bold");
    doc.setFontSize(13);
    doc.setTextColor(...brand);
    doc.text("RAPPORTINO GIORNALIERO", 16, 20);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);
    doc.setTextColor(...text);
    doc.text(meta, 16, 26, { maxWidth: 178 });

    // footer
    doc.setFontSize(9);
    doc.text(`Pagina ${i}/${pages}`, 196, 287, { align: "right" });
  }
}

/* --------------------- export principal --------------------- */
/**
 * exportRapportoPdf({
 *   todayKey, taskLabel, impiantoId, capoName, rows,
 *   workers = [], activities = []
 * })
 */
export function exportRapportoPdf({
  todayKey, taskLabel, impiantoId, capoName, rows,
  workers = [], activities = []
} = {}) {
  const dateNice = formatDateNice(
    typeof todayKey === "string" && todayKey.length===10 ? todayKey : new Date()
  );

  const shaped  = shapeRows(rows||[], workers, activities);
  const grouped = collapseBinomes(shaped); // <= binômes (ou plus) fusionnés

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: "Rapportino Giornaliero",
    subject: "Rapporto giornaliero",
    creator: "Naval Planner"
  });

  const meta = `Data: ${dateNice} • Impianto: ${impiantoId||"-"} • Task: ${taskLabel||"-"} • Capo Squadra: ${capoName||"-"}`;

  // colonnes italiennes standard comme vos feuilles
  const head = [
    "OPERATORE",
    "Tempo impiegato",
    "DESCRIZIONE ATTIVITA'",
    "PRODOTTO",
    "PREVISTO A PERSONA",
    "NOTE"
  ];

  // si tu n'as pas le "previsto a persona", laisse vide
  const body = grouped.map(r => ([
    r.name,                        // 1 ou plusieurs opérateurs
    r.hours,                       // même durée pour le binôme
    r.activityLabel,               // descrizione
    r.qtyDisplay || "",            // prodotto
    "",                            // previsto a persona (optionnel)
    r.note || ""                   // note
  ]));

  doc.autoTable({
    startY: 32,
    head: [head],
    body,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
      textColor: [17,24,39],
      lineColor: [210,214,220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [79,70,229],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { fillColor: [255,255,255] },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles: {
      0: { cellWidth: 42 },             // operatore
      1: { halign: "right", cellWidth: 22 },
      2: { cellWidth: 62 },             // descrizione
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "right", cellWidth: 28 },
      5: { cellWidth: "wrap" }
    },
    willDrawCell(data){
      // permet les sauts de lignes dans OPERATORE
      if (data.section==="body" && data.column.index===0) {
        data.cell.styles.minCellHeight = Math.max(8, 4 * (String(data.cell.text)?.split("\n").length || 1));
      }
    },
    didDrawPage: () => decoratePages(doc, { meta }),
    margin: { top: 28, right: 14, bottom: 28, left: 14 },
  });

  // totaux
  const totOre = grouped.reduce((s,r)=>s+(Number(r.hours)||0),0);
  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica","bold");
  doc.setFontSize(11);
  doc.text(`Totale ore: ${totOre} h`, 196, y, { align: "right" });

  // signatures
  const y2 = y + 14, w = 80;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text("Firma Capo", 14, y2);               doc.line(14, y2+2, 14+w, y2+2);
  doc.text("Firma Responsabile", 14+w+18, y2);   doc.line(14+w+18, y2+2, 14+w+18+w, y2+2);

  const fnDate = (typeof todayKey==="string" ? todayKey : new Date().toISOString().slice(0,10));
  doc.save(`rapporto_${fnDate}.pdf`);
}
