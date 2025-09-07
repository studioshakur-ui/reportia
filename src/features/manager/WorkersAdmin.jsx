import React from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { KEYS, saveJSON } from "../../lib/storage";

export default function WorkersAdmin({ workers, setWorkers }) {
  const toggleRole = (id) => {
    const wasCapo = workers.find(w=>w.id===id)?.role === "capo";
    const nextWorkers = workers.map(w =>
      w.id === id ? { ...w, role: wasCapo ? "operaio" : "capo" } : w
    );
    setWorkers(nextWorkers); saveJSON(KEYS.WORKERS, nextWorkers);

    if (wasCapo) {
      const groups = JSON.parse(localStorage.getItem(KEYS.GROUPS)||"[]");
      const updated = groups.map(g => g.capoId === id ? { ...g, capoId: "", memberIds: Array.from(new Set([...(g.memberIds||[]), id])) } : g );
      saveJSON(KEYS.GROUPS, updated);
    }
  };
  const renameWorker = (id, name) => { const next = workers.map(w => (w.id === id ? { ...w, name } : w)); setWorkers(next); saveJSON(KEYS.WORKERS, next); };
  const addWorker = () => { const name = prompt("Nom du nouvel ouvrier :"); if (!name) return; const slug = name.toLowerCase().replace(/\s+/g,"-"); const w={id:slug,name,role:"operaio"}; const next=[...workers,w]; setWorkers(next); saveJSON(KEYS.WORKERS,next); };
  const removeWorker = (id) => { if(!confirm("Supprimer ?")) return; const next=workers.filter(w=>w.id!==id); setWorkers(next); saveJSON(KEYS.WORKERS,next); };

  const capiCount = workers.filter(w=>w.role==="capo").length;

  return (
    <Card>
      <SectionTitle title="Personnel — Capi & Operai" subtitle={`${capiCount} Capo actuellement.`} right={<Button size="sm" onClick={addWorker}>Ajouter</Button>} />
      <div className="max-h-80 overflow-auto rounded-2xl border p-2">
        {workers.map(w => (
          <div key={w.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <input className="flex-1 bg-transparent border rounded-xl px-2 py-1" value={w.name} onChange={(e)=>renameWorker(w.id, e.target.value)} />
            <button className={`px-2 py-1 rounded-full text-xs ${w.role==="capo" ? "bg-indigo-600 text-white" : "bg-black/10 dark:bg-white/10"}`} onClick={()=>toggleRole(w.id)}>{w.role==="capo"?"Capo":"Operaio"}</button>
            <Button size="sm" variant="danger" onClick={()=>removeWorker(w.id)}>Suppr</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
