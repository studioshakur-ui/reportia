// src/features/capo/CapoPanel.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { ChevronDown, Save, Check, FileText } from "lucide-react";
import { exportRapportoPdf } from "../../lib/pdf";
import { KEYS, loadJSON, saveJSON } from "../../lib/storage";
import CapoGroupsBoard from "./CapoGroupsBoard";

export default function CapoPanel({
  todayKey, plan, workers, user, reports, setReports,
  tasks, impianti, activities, status, setStatus
}) {
  const plannedRaw = plan[todayKey];
  if (!plannedRaw) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card><SectionTitle title="Aucune affectation" subtitle="Demande au manager d’assigner la journée." /></Card>
      </div>
    );
  }
  if (user?.role === "capo" && plannedRaw.capoId && plannedRaw.capoId !== user.id) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card><SectionTitle title="Accès restreint" subtitle="Cette journée n'est pas assignée à votre équipe." /></Card>
      </div>
    );
  }

  // Sécurité : si équipe vide mais capo défini ⇒ afficher au moins le capo
  const planned = useMemo(() => {
    if ((plannedRaw.team||[]).length) return plannedRaw;
    if (plannedRaw.capoId) return { ...plannedRaw, team: [plannedRaw.capoId] };
    return plannedRaw;
  }, [plannedRaw]);

  const [taskId, setTaskId] = useState(planned.taskId || tasks[0]?.id);
  const [impiantoId, setImpiantoId] = useState(planned.impiantoId || impianti[0]);
  const [savedFx, setSavedFx] = useState(status[todayKey] === "saved");

  // 🗂️ Pièces jointes
  const [attachMap, setAttachMap] = useState(()=> loadJSON(KEYS.ATTACH, {}));
  const dayFiles = attachMap[todayKey] || [];
  const persistAttach = (nextMap) => { setAttachMap(nextMap); saveJSON(KEYS.ATTACH, nextMap); };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []); if (!files.length) return;
    const toDataURL = (f) => new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res({ name: f.name, type: f.type, size: f.size, dataURL: fr.result });
      fr.onerror = rej; fr.readAsDataURL(f);
    });
    const payloads = [];
    for (const f of files) { try{ payloads.push(await toDataURL(f)); }catch{} }
    const nextMap = { ...attachMap, [todayKey]: [...dayFiles, ...payloads] };
    persistAttach(nextMap);
  };
  const removeFile = (idx) => {
    const next = (attachMap[todayKey]||[]).filter((_,i)=>i!==idx);
    persistAttach({ ...attachMap, [todayKey]: next });
  };

  const handleSave = (rows) => {
    const payload = { rows, taskId, impiantoId, savedAt: Date.now(), capoId: planned.capoId };
    const next = { ...(reports||{}) }; next[todayKey] = payload;
    setReports(next);
    const st = { ...(status||{}) }; st[todayKey] = "saved"; setStatus(st);
    setSavedFx(true); setTimeout(()=>setSavedFx(false), 1200);
  };

  const handlePdf = (rows) => {
    const capoName = workers.find(w=>w.id===planned.capoId)?.name || planned.capoId || "";
    const taskLabel = tasks.find(t=>t.id===taskId)?.label || taskId;

    // On enrichit les rows (nom opérateur + regroupements binômes si même activité + même groupe)
    const rowsPdf = rows.map(r=>{
      const w = workers.find(x=>x.id===r.id)?.name || r.id;
      const act = activities.find(a=>a.id===r.activityId);
      return {
        ...r,
        name: w,
        activityLabel: act?.label || r.activityId,
        previstoPerPerson: r.previstoPerPerson || '', // optionnel
      };
    });

    exportRapportoPdf({ todayKey, taskLabel, impiantoId, capoName, rows: rowsPdf });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden space-y-4">
      <SectionTitle title="Capo — Groupes & activités" subtitle="Organise tes groupes. Une seule activité par groupe, chaque opérateur a ses heures/quantité/note. (Mobile: menus au lieu de drag&drop.)" />

      {/* Barre de paramètres du jour */}
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="min-w-0">
            <label className="text-sm font-medium">Tâche du jour</label>
            <div className="mt-2 relative">
              <select className="w-full h-10 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl pl-3 pr-10"
                      value={taskId} onChange={(e)=>setTaskId(e.target.value)}>
                {tasks.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            </div>
          </div>
          <div className="min-w-0">
            <label className="text-sm font-medium">Impianto</label>
            <div className="mt-2 relative">
              <select className="w-full h-10 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl pl-3 pr-10"
                      value={impiantoId} onChange={(e)=>setImpiantoId(e.target.value)}>
                {impianti.map(i => (<option key={i} value={i}>{i}</option>))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Button variant={savedFx ? "success" : "ghost"} icon={savedFx ? Check : Save} className={savedFx ? "animate-[pulse_0.9s_ease_1]" : ""} disabled>
              {savedFx ? "Enregistré ✓" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Board groupes (avec menus mobile) */}
      <CapoGroupsBoard
        planned={planned}
        workers={workers}
        activities={activities}
        onSave={handleSave}
        onExportPdf={handlePdf}
      />

      {/* Pièces jointes */}
      <Card>
        <div className="p-4">
          <SectionTitle icon={FileText} title="Joindre des fichiers (Capo)" subtitle="Ajoute des photos, PDF ou documents Excel au rapport du jour." />
          <div className="grid gap-3">
            <input type="file" accept=".pdf,.xlsx,.xls,image/*" multiple
                   className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                   onChange={(e)=>handleFiles(e.target.files)} />
            {dayFiles.length > 0 ? (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 p-2">
                <div className="text-sm font-medium mb-2">Fichiers du {todayKey}</div>
                <ul className="space-y-1">
                  {dayFiles.map((f, idx)=>(
                    <li key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <a className="truncate underline hover:no-underline" href={f.dataURL} download={f.name} target="_blank" rel="noreferrer">
                        {f.name} <span className="opacity-60">({Math.ceil((f.size||0)/1024)} Ko)</span>
                      </a>
                      <button className="text-rose-600 text-xs font-semibold hover:underline" onClick={()=>removeFile(idx)}>Suppr</button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <div className="text-sm opacity-70">Aucun fichier joint pour l’instant.</div>}
          </div>
        </div>
      </Card>

      {/* Actions sticky */}
      <div className="sticky bottom-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-black/10 dark:border-white/10 shadow-md p-2 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Haut de page</Button>
            <Button onClick={()=>handlePdf((reports?.[todayKey]?.rows)||[])}>Exporter PDF</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
