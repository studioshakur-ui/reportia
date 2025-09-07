// src/lib/excelOrg.jsx
import React from "react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import slug from "./slug";
import { KEYS, saveJSON } from "./storage";

/**
 * ExcelOrgImporter
 * Feuille attendue : 2 colonnes "Capo" | "Operaio" (ou "Capo Squadra" | "Operatore")
 * Exemple:
 *   Capo                | Operaio
 *   GIUNTA CARMELO      | ROSSI
 *   GIUNTA CARMELO      | DIALLO
 *   MAIGA HAMIDOU       | TRAORE
 *
 * Effet :
 * - Met à jour le listing complet des workers (rôles déduits)
 * - Construit les groups dans KEYS.GROUPS : { id, name, capoId, memberIds }
 */
export default function ExcelOrgImporter({ setWorkers }) {
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: "array" });

      // 1) on cherche une feuille qui ressemble à un organigramme
      const candidateNames = [
        "Organigramma", "Organigramme", "Squadre", "Squadra", "Org", "Sheet1",
        "MO-PROGRAMMA", "PROGRAMMA", "PROGRAMMA SETTIMANA"
      ];

      let sh = null;
      for (const name of wb.SheetNames) {
        if (candidateNames.some((k) => name.toLowerCase().includes(k.toLowerCase()))) {
          sh = wb.Sheets[name];
          break;
        }
      }
      if (!sh) sh = wb.Sheets[wb.SheetNames[0]]; // fallback

      const rows = XLSX.utils.sheet_to_json(sh, { header: 1, raw: false });
      if (!rows.length) throw new Error("Feuille vide.");

      // 2) on identifie les colonnes Capo/Operaio (ou variantes)
      const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const capoIdx =
        header.findIndex((h) => ["capo", "capo squadra", "capi"].includes(h));
      const operaioIdx =
        header.findIndex((h) => ["operaio", "operatore", "opérai", "ouvrier"].includes(h));

      if (capoIdx === -1 || operaioIdx === -1) {
        throw new Error(
          "Colonnes introuvables. Attendu: 'Capo' et 'Operaio' (ou 'Capo Squadra' | 'Operatore')."
        );
      }

      // 3) construire les paires Capo-Operaio
      const pairs = [];
      for (let i = 1; i < rows.length; i++) {
        const capoName = String(rows[i]?.[capoIdx] || "").trim();
        const opName   = String(rows[i]?.[operaioIdx] || "").trim();
        if (!capoName || !opName) continue;
        pairs.push({ capoName, opName });
      }
      if (!pairs.length) throw new Error("Aucun couple Capo-Operaio trouvé.");

      // 4) déduire workers & groupes
      const capiMap = new Map();     // name -> id
      const operai  = new Map();     // name -> id
      const groupsByCapo = new Map();// capoId -> Set(memberIds)

      const ensureId = (name) => slug(name);

      for (const { capoName, opName } of pairs) {
        const capoId = capiMap.get(capoName) || ensureId(capoName);
        capiMap.set(capoName, capoId);

        const opId = operai.get(opName) || ensureId(opName);
        operai.set(opName, opId);

        if (!groupsByCapo.has(capoId)) groupsByCapo.set(capoId, new Set());
        groupsByCapo.get(capoId).add(opId);
      }

      // workers finaux (capi + operai)
      const workers = [
        ...Array.from(capiMap.entries()).map(([name, id]) => ({ id, name, role: "capo" })),
        ...Array.from(operai.entries()).map(([name, id]) => ({ id, name, role: "operaio" })),
      ];

      // groups finaux
      const groups = Array.from(capiMap.entries()).map(([capoName, capoId]) => ({
        id: `squadra-${capoId}`,
        name: capoName,
        capoId,
        memberIds: Array.from(groupsByCapo.get(capoId) || []),
      }));

      // 5) sauvegardes locales
      setWorkers?.(workers);
      saveJSON(KEYS.WORKERS, workers);
      saveJSON(KEYS.GROUPS, groups);

      alert(`Organigramme importé : ${groups.length} squadre • ${workers.length} personnes.`);
    } catch (err) {
      alert("Erreur import Organigramme: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 cursor-pointer">
      <Upload className="w-4 h-4" />
      Importer Organigramme (.xlsx)
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onPick} />
    </label>
  );
}
