// src/lib/pdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // << important: importer la fonction ESM
import { parseQtyDisplay } from "../constants/previsto";

/**
 * Export PDF Rapportino
 * @param {Object} params
 * @param {string} params.todayKey      - ex: "2025-09-07"
 * @param {string} params.impiantoId
 * @param {string} params.capoName
 * @param {Array}  params.rows          - [{ name, hours, activityLabel, qtyFattoDisplay, previstoDisplay, note }]
 * @param {string} [params.logoDataUrl] - dataURL PNG/JPG optionnel
 */
export function exportRapportoPdf({ todayKey, impiantoId, capoName, rows, logoDataUrl = null }) {
  const dd = new jsPDF({ unit: "pt", format: "a4" });
  const d = new Date(todayKey);
  const dateStr = d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });

  // Header
  let x = 40, y = 40;

  if (logoDataUrl) {
    try {
      dd.addImage(logoDataUrl, "PNG", x, y - 10, 90, 90);
      x = 140; // décaler le texte quand logo
    } catch {}
  }

  dd.setFontSize(14); dd.text("Rapportino di Lavoro", x, y);
  dd.setFontSize(10);
  dd.text(`Data: ${dateStr}`, x, y + 18);
  dd.text(`Impianto: ${impiantoId}`, x + 160, y + 18);
  if (capoName) dd.text(`Capo Squadra: ${capoName}`, x, y + 34);

  // Corps
  const body = rows.map(r => [
    r.name || "",
    String(r.hours ?? ""),
    r.activityLabel || "",
    r.qtyFattoDisplay || "",
    r.previstoDisplay || "",
    r.note || ""
  ]);

  // Préparer la coloration en fonction du comparatif fatto vs previsto
  const compareMeta = rows.map(r => {
    const fatto = parseQtyDisplay(r.qtyFattoDisplay);
    const prev  = parseQtyDisplay(r.previstoDisplay);
    const comparable = fatto.qtyNum != null && prev.qtyNum != null && (!prev.unit || (fatto.unit === prev.unit));
    let state = "none";
    if (comparable) state = (fatto.qtyNum >= prev.qtyNum) ? "ok" : "low";
    return { comparable, state };
  });

  // 👉 utiliser la fonction autoTable(dd, options)
  autoTable(dd, {
    startY: logoDataUrl ? (y + 80) : (y + 50),
    head: [["Operatore","Ore (h)","Attività","Quantità (fatto)","Previsto a persona","Note"]],
    body,
    styles:    { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    headStyles:{ fillColor:[70,76,230], textColor: 255 },
    theme: "striped",
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      const r = data.row.index;
      const c = data.column.index;
      if (data.section === "body" && compareMeta[r]?.comparable) {
        if (compareMeta[r].state === "ok" && (c === 3 || c === 4)) {
          data.cell.styles.textColor = [22, 163, 74];     // vert
        } else if (compareMeta[r].state === "low" && (c === 3 || c === 4)) {
          data.cell.styles.textColor = [234, 88, 12];     // orange
        }
      }
    }
  });

  const tableEnd = dd.lastAutoTable.finalY;
  const totHours = rows.reduce((s, r) => s + (Number(r.hours) || 0), 0);

  dd.setFontSize(10);
  dd.text(`Totale ore: ${totHours} h`, 40, tableEnd + 20);

  // Signatures
  const sigY = tableEnd + 60;
  dd.line(40, sigY, 240, sigY);    dd.text("Firma Capo", 40, sigY + 14);
  dd.line(320, sigY, 520, sigY);   dd.text("Firma Responsabile", 320, sigY + 14);

  dd.save(`rapporto_${todayKey}.pdf`);
}
