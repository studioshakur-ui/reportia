import React from "react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import slug from "./slug";

export default function ExcelImporter({ onWorkers }) {
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array" });
      const sh   = wb.Sheets["ElencoDIPxCONVALIDA"] || wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sh, { header: 1, raw: false });

      const workers = [];
      for (let i = 1; i < rows.length; i++) {
        const name = String(rows[i]?.[0] || "").trim();
        if (!name || /dipendente/i.test(name)) continue;
        workers.push({ id: slug(name), name, role: "operaio" });
      }
      if (!workers.length) { alert("Aucun nom détecté dans Elenco."); return; }
      onWorkers(workers);
      alert(`Import réussi: ${workers.length} travailleurs.`);
    } catch (err) {
      alert("Erreur d'import: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 cursor-pointer">
      <Upload className="w-4 h-4" /> Importer Excel (.xlsx)
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onPick} />
    </label>
  );
}
