import React, { useState } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { ClipboardList, FilePlus2, Settings } from "lucide-react";
import { KEYS, saveJSON } from "../../lib/storage";

export default function CatalogueManager({ tasks, setTasks, impianti, setImpianti, activities, setActivities }) {
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskSize, setNewTaskSize] = useState(2);
  const addTask = () => { const label = newTaskLabel.trim(); if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g,"-"); const t = { id, label, defaultTeamSize: Math.max(1, Number(newTaskSize)||2) };
    const next = [...tasks, t]; setTasks(next); saveJSON(KEYS.TASKS, next); setNewTaskLabel(""); setNewTaskSize(2); };
  const delTask = (id) => { const next = tasks.filter(t => t.id !== id); setTasks(next); saveJSON(KEYS.TASKS, next); };
  const renameTask = (id, label) => { const next = tasks.map(t => t.id === id ? { ...t, label } : t); setTasks(next); saveJSON(KEYS.TASKS, next); };
  const resizeTask = (id, size) => { const next = tasks.map(t => t.id === id ? { ...t, defaultTeamSize: Math.max(1, Number(size)||1) } : t); setTasks(next); saveJSON(KEYS.TASKS, next); };

  const [newImp, setNewImp] = useState("");
  const addImp = () => { const v = newImp.trim(); if (!v) return; const next = [...impianti, v]; setImpianti(next); saveJSON(KEYS.IMPIANTI, next); setNewImp(""); };
  const delImp = (v) => { const next = impianti.filter(x => x !== v); setImpianti(next); saveJSON(KEYS.IMPIANTI, next); };
  const renameImp = (oldV, newV) => { const next = impianti.map(x => x===oldV ? newV : x); setImpianti(next); saveJSON(KEYS.IMPIANTI, next); };

  const [newActLabel, setNewActLabel] = useState("");
  const [newActUnit, setNewActUnit]   = useState("pz");
  const addAct = () => { const label=newActLabel.trim(); if(!label) return; const id=label.toLowerCase().replace(/\s+/g,"-"); const next=[...activities, {id,label,unit:newActUnit}]; setActivities(next); saveJSON(KEYS.ACTIVITIES, next); setNewActLabel(""); setNewActUnit("pz"); };
  const delAct = (id) => { const next = activities.filter(a=>a.id!==id); setActivities(next); saveJSON(KEYS.ACTIVITIES, next); };
  const editAct = (id, field, val) => { const next = activities.map(a=>a.id===id?{...a,[field]:val}:a); setActivities(next); saveJSON(KEYS.ACTIVITIES, next); };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <SectionTitle icon={FilePlus2} title="Catalogue — Tâches" subtitle="Ajoute / renomme / supprime. Taille d’équipe indicative." />
        <div className="flex gap-2">
          <input className="flex-1 border rounded-2xl px-3 py-2" placeholder="Nouvelle tâche" value={newTaskLabel} onChange={(e)=>setNewTaskLabel(e.target.value)} />
          <input className="w-24 border rounded-2xl px-3 py-2" type="number" min={1} value={newTaskSize} onChange={(e)=>setNewTaskSize(e.target.value)} />
          <Button onClick={addTask}>Ajouter</Button>
        </div>
        <div className="mt-4 space-y-2">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 border rounded-2xl px-3 py-2">
              <input className="flex-1 border rounded-xl px-2 py-1" value={t.label} onChange={(e)=>renameTask(t.id,e.target.value)} />
              <input className="w-20 border rounded-xl px-2 py-1" type="number" min={1} value={t.defaultTeamSize} onChange={(e)=>resizeTask(t.id,e.target.value)} />
              <Button variant="danger" size="sm" onClick={()=>delTask(t.id)}>Suppr</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-1">
        <SectionTitle icon={Settings} title="Catalogue — Impianti" subtitle="Zones / chantiers." />
        <div className="flex gap-2">
          <input className="flex-1 border rounded-2xl px-3 py-2" placeholder="Nouvel impianto" value={newImp} onChange={(e)=>setNewImp(e.target.value)} />
          <Button onClick={addImp}>Ajouter</Button>
        </div>
        <div className="mt-4 space-y-2">
          {impianti.map((imp, idx) => (
            <div key={`${imp}-${idx}`} className="flex items-center gap-2 border rounded-2xl px-3 py-2">
              <input className="flex-1 border rounded-xl px-2 py-1" value={imp} onChange={(e)=>renameImp(imp,e.target.value)} />
              <Button variant="danger" size="sm" onClick={()=>delImp(imp)}>Suppr</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-1">
        <SectionTitle icon={ClipboardList} title="Catalogue — Activités" subtitle="Ce que le Capo peut assigner par groupe (avec unité)." />
        <div className="flex gap-2">
          <input className="flex-1 border rounded-2xl px-3 py-2" placeholder="Nouvelle activité (ex: Montaggio lampade)" value={newActLabel} onChange={(e)=>setNewActLabel(e.target.value)} />
          <select className="w-28 border rounded-2xl px-3 py-2" value={newActUnit} onChange={(e)=>setNewActUnit(e.target.value)}>
            <option value="pz">pz</option>
            <option value="m">m</option>
            <option value="">—</option>
          </select>
          <Button onClick={addAct}>Ajouter</Button>
        </div>
        <div className="mt-4 space-y-2">
          {activities.map(a=>(
            <div key={a.id} className="flex items-center gap-2 border rounded-2xl px-3 py-2">
              <input className="flex-1 border rounded-xl px-2 py-1" value={a.label} onChange={(e)=>editAct(a.id,"label",e.target.value)} />
              <select className="w-24 border rounded-xl px-2 py-1" value={a.unit} onChange={(e)=>editAct(a.id,"unit",e.target.value)}>
                <option value="pz">pz</option><option value="m">m</option><option value="">—</option>
              </select>
              <Button variant="danger" size="sm" onClick={()=>delAct(a.id)}>Suppr</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
