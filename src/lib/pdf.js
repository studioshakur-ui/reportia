// src/lib/pdf.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// rows attendus: [{ id, name?, group, activityLabel, hours, qtyDisplay, note, previstoPerPerson? }]
// options: { todayKey, taskLabel, impiantoId, capoName }
export function exportRapportoPdf({ todayKey, taskLabel, impiantoId, capoName, rows }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RAPPORTINO GIORNALIERO', 297, 40, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`DATA: ${fmtDate(todayKey)}`, 500, 60);
  doc.text(`CAPO SQUADRA: ${capoName || '-'}`, 40, 60);
  doc.text(`IMPIANTO: ${impiantoId || '-'}`, 40, 75);
  doc.text(`ATTIVITÀ/TASK: ${taskLabel || '-'}`, 40, 90);

  // Corps du tableau
  const head = [[
    'OPERATORE',
    'Tempo impiegato',
    'DESCRIZIONE ATTIVITA\'',
    'PRODOTTO',
    'PREVISTO A PERSONA',
    'NOTE'
  ]];

  // Si un opérateur peut apparaître dans plusieurs groupes, on prend le nom au vol
  const body = rows.map(r => ([
    r.name || r.id,
    String(r.hours || 0),
    r.activityLabel || '',
    r.qtyDisplay || '',
    r.previstoPerPerson ? String(r.previstoPerPerson) : '',
    r.note || ''
  ]));

  autoTable(doc, {
    head,
    body,
    startY: 110,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, lineWidth: 0.5 },
    headStyles: { fillColor: [250, 250, 250], textColor: 20, fontStyle: 'bold' },
    tableLineWidth: 0.5,
    tableLineColor: [200, 200, 200],
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 80, halign: 'center' },
      2: { cellWidth: 160 },
      3: { cellWidth: 90, halign: 'center' },
      4: { cellWidth: 110, halign: 'center' },
      5: { cellWidth: 'auto' }
    }
  });

  doc.save(`rapporto_${todayKey}.pdf`);
}

function fmtDate(key) {
  // key "YYYY-MM-DD"
  const [y,m,d] = key.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
}
