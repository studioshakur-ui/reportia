// src/features/capo/CapoPanel.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { ChevronDown, Save, Check } from "lucide-react";
import { exportRapportoPdf } from "../../lib/pdf";
import { previstoFor } from "../../constants/previsto";

import CapoGroupsBoard from "./CapoGroupsBoard";

export default function CapoPanel({ todayKey, plan, workers, user, reports, setReports, tasks, impianti, activities, status, setStatus }) {
  const plannedRaw = plan[todayKey];
  if (!plannedRaw) return <Card><SectionTitle title="Aucune affectation" subtitle="Demande au manager d’assigner la journée." /></Card>;
  if (user?.role==="capo" && plannedRaw.capoId && plannedRaw.capoId !== user.id)
    return <Card><SectionTitle title="Accès restreint" subtitle="Cette journée n'est pas assignée à votre équipe." /></Card>;

  const planned = useMemo(() => {
    if ((plannedRaw.team||[]).length) return plannedRaw;
    if (plannedRaw.capoId) return { ...plannedRaw, team: [plannedRaw.capoId] };
    return plannedRaw;
  }, [plannedRaw]);

  // ! Ici: seulement l'IMPIANTO importe (la "Task" n'a pas de sens pour le rapportino du capo)
  const [impiantoId, setImpiantoId] = useState(planned.impiantoId || impianti[0]);
  const [savedFx, setSavedFx] = useState(status[todayKey] === "saved");

  const handleSave = (rows) => {
    const payload = { rows, impiantoId, savedAt: Date.now(), capoId: planned.capoId };
    const next = { ...(reports||{}) }; next[todayKey] = payload;
    setReports(next); localStorage.setItem("planner.capo.reports.v1", JSON.stringify(next));
    const st = { ...(status||{}) }; st[todayKey] = "saved"; setStatus(st); localStorage.setItem("planner.capo.status.v1", JSON.stringify(st));
    setSavedFx(true); setTimeout(()=>setSavedFx(false), 1200);
  };

  const handlePdf = (rows) => {
    const capoName = workers.find(w=>w.id===planned.capoId)?.name || planned.capoId || "";

    // Enrichir chaque ligne avec labels & previsto
    const rowsPdf = rows.map(r=>{
      const wName = workers.find(x=>x.id===r.id)?.name || r.id;
      const act   = activities.find(a=>a.id===r.activityId);
      const actLabel = act?.label || r.activityId;

      const p = previstoFor(actLabel); // {display, qtyNum, unit}
      return {
        name: wName,
        hours: r.hours,
        activityLabel: actLabel,
        qtyFattoDisplay: r.qtyDisplay || "",
        previstoDisplay: p.display,
        note: r.note || "",
      };
    });

    exportRapportoPdf({
      todayKey,
      impiantoId,
      capoName,
      rows: rowsPdf
    });
  };

  return (
    <div className="space-y-4">
      <SectionTitle title="Capo — Groupes & activités" subtitle="Une seule activité par groupe, chaque operatore a ses heures/quantité/note." />
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Impianto</label>
            <div className="mt-2 relative">
              <select className="w-full bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 pr-10"
                value={impiantoId} onChange={(e)=>setImpiantoId(e.target.value)}>
                {impianti.map(i => (<option key={i} value={i}>{i}</option>))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
            </div>
          </div>
          <div className="md:col-span-2 flex items-end justify-end">
            <Button
              variant={savedFx ? "success" : "ghost"}
              icon={savedFx ? Check : Save}
              className={savedFx ? "animate-[pulse_0.9s_ease_1]" : ""}
              onClick={()=>{}}
              disabled
            >
              {savedFx ? "Enregistré ✓" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Card>

      <CapoGroupsBoard
        planned={planned}
        workers={workers}
        activities={activities}
        onSave={handleSave}
        onExportPdf={handlePdf}
      />
    </div>
  );
}
