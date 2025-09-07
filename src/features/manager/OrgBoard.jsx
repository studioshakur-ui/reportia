// src/features/manager/OrgBoard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Map as MapIcon } from "lucide-react";
import { KEYS, saveJSON, loadJSON } from "../../lib/storage";
import slug from "../../lib/slug";
import ExcelOrgImporter from "../../lib/excelOrg";

export default function OrgBoard({ workers, setWorkers, plan, setPlan, tasks, impianti, isManager }) {
  const [groups, setGroups] = useState(() => loadJSON(KEYS.GROUPS, [
    { id: "squadra-giunta",     name: "GIUNTA CARMELO",      capoId: slug("GIUNTA CARMELO"),       memberIds: [] },
    { id: "squadra-maiga",      name: "MAIGA HAMIDOU",       capoId: slug("MAIGA HAMIDOU"),        memberIds: [] },
    { id: "squadra-mogavero",   name: "MOGAVERO GIANPIERO",  capoId: slug("MOGAVERO GIANPIERO"),   memberIds: [] },
    { id: "squadra-scicolone",  name: "SCICOLONE MASSIMO",   capoId: slug("SCICOLONE MASSIMO"),    memberIds: [] },
  ]));
  useEffect(()=>saveJSON(KEYS.GROUPS, groups), [groups]);

  const byId = useMemo(()=>Object.fromEntries(workers.map(w=>[w.id,w])),[workers]);

  const addSquadra = () => { const n = groups.length + 1; setGroups([...groups, { id: `squadra-${Date.now()}`, name: `Squadra ${n}`, capoId: "", memberIds: [] }]); };
  const delSquadra = (id) => setGroups(groups.filter(g=>g.id!==id));
  const renameSquadra = (id, name) => setGroups(groups.map(g=>g.id===id?{...g,name}:g));
  const setCapo = (gid, capoId) => setGroups(groups.map(g=>g.id===gid?{...g,capoId}:g));

  // DnD
  const [drag, setDrag] = useState(null); // { workerId, fromGroupId | null }
  const onDragStart = (workerId, fromGroupId) => (e) => { try{e.dataTransfer.setData("text/plain",workerId); e.dataTransfer.effectAllowed="move";}catch{} setDrag({workerId, fromGroupId}); };
  const onDragOver = (e) => { e.preventDefault(); try{e.dataTransfer.dropEffect="move";}catch{} };
  const onDrop = (toGroupId) => (e) => {
    e.preventDefault();
    const workerId = drag?.workerId || (()=>{ try{return e.dataTransfer.getData("text/plain");}catch{return null;} })();
    if (!workerId) return;
    setGroups(prev=>{
      let next=[...prev];
      if (drag?.fromGroupId) next=next.map(g=> g.id===drag.fromGroupId ? {...g, memberIds:(g.memberIds||[]).filter(id=>id!==workerId)} : g );
      next=next.map(g=> g.id===toGroupId ? {...g, memberIds: Array.from(new Set([...(g.memberIds||[]), workerId])) } : g );
      next=next.map(g => ({ ...g, capoId: g.capoId === workerId ? "" : g.capoId }));
      return next;
    });
    setDrag(null);
  };

  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().slice(0,10));
  const assignToDate = (g, dateStr) => {
    const key = dateStr || new Date().toISOString().slice(0,10);
    const updated = {
      ...plan,
      [key]: {
        ...(plan[key]||{}),
        taskId: (plan[key]?.taskId)||tasks[0]?.id,
        impiantoId: (plan[key]?.impiantoId)||impianti[0],
        capoId: g.capoId || "",
        team: [g.capoId, ...g.memberIds].filter(Boolean)
      }
    };
    setPlan(updated); saveJSON(KEYS.PLAN, updated);
    alert(`Affecté au ${key} : ${g.name} (${[g.capoId, ...g.memberIds].filter(Boolean).length} pers.)`);
  };

  // liste "free" = non assignés dans une squadra
  const usedIds = new Set(groups.flatMap(g=>[g.capoId, ...g.memberIds].filter(Boolean)));
  const freeWorkers = workers.filter(w=>!usedIds.has(w.id));

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={MapIcon}
        title="Organigramme (drag & drop)"
        subtitle="Déplace les ouvriers entre les squadre, ou dépose-les dans le roster pour les libérer."
        right={isManager && (
          <div className="flex items-center gap-2">
            {/* Import Excel → Organigramme */}
            <ExcelOrgImporter setWorkers={setWorkers} />
            <input type="date" className="border rounded-xl px-2 py-1 text-sm" value={assignDate} onChange={e=>setAssignDate(e.target.value)} />
            <Button onClick={addSquadra}>Nouvelle squadra</Button>
          </div>
        )}
      />

      {/* Roster — accepte les drops */}
      <Card>
        <div className="text-sm font-medium mb-2">Roster (non assignés)</div>
        <div
          className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
          onDragOver={onDragOver}
          onDropCapture={isManager ? (e) => {
            e.preventDefault();
            const wid = drag?.workerId || (() => { try { return e.dataTransfer.getData("text/plain"); } catch { return null; } })();
            if (!wid) return;
            setGroups(prev => prev.map(g => ({ ...g, memberIds: (g.memberIds || []).filter(id => id !== wid), capoId: g.capoId === wid ? "" : g.capoId })));
            setDrag(null);
          } : undefined}
        >
          {freeWorkers.map(w=>(
            <span key={w.id} draggable={isManager} onDragStart={isManager?onDragStart(w.id, null):undefined}
              className={`px-2 py-1 rounded-full text-xs ${w.role==="capo"?"bg-indigo-600/15 text-indigo-700 dark:text-indigo-300":"bg-black/5 dark:bg-white/10"} ${isManager?"cursor-grab":""}`}>
              {w.name}{w.role==="capo"?" (Capo)":""}
            </span>
          ))}
          {!freeWorkers.length && <span className="text-xs opacity-60">— Glisser ici pour libérer —</span>}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {groups.map(g=>{
          const capo = byId[g.capoId];
          return (
            <Card key={g.id} className="relative">
              <div className="flex items-center justify-between gap-2">
                {isManager ? (
                  <input className="font-semibold bg-transparent outline-none" value={g.name} onChange={e=>renameSquadra(g.id, e.target.value)} />
                ) : (<div className="font-semibold">{g.name}</div>)}
                <div className="flex items-center gap-2">
                  <Badge>{(g.memberIds||[]).length} ouv.</Badge>
                  {isManager && <Button variant="outline" size="sm" onClick={()=>assignToDate(g, assignDate)}>Affecter à la date</Button>}
                  {isManager && <Button variant="danger" size="sm" onClick={()=>delSquadra(g.id)}>Suppr</Button>}
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wide mb-1 opacity-60">Capo</div>
                  {isManager ? (
                    <select className="w-full border rounded-2xl px-3 py-2"
                            value={g.capoId||""}
                            onChange={(e)=>setCapo(g.id, e.target.value)}
                            onDragOver={onDragOver}
                            onDropCapture={isManager ? (e)=>{ // drop d'un capo
                              const wid = drag?.workerId || (()=>{ try{return e.dataTransfer.getData("text/plain");}catch{return null;} })();
                              if (!wid) return;
                              setGroups(prev => prev.map(x => x.id===g.id
                                ? { ...x, capoId: wid, memberIds: (x.memberIds||[]).filter(id=>id!==wid) }
                                : { ...x, capoId: x.capoId === wid ? "" : x.capoId, memberIds: (x.memberIds||[]).filter(id=>id!==wid) }
                              ));
                              setDrag(null);
                            } : undefined}
                    >
                      <option value="">— Aucun —</option>
                      {workers.filter(w=>w.role==="capo").map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  ) : (<div className="px-3 py-2 rounded-xl border">{capo?.name||"—"}</div>)}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide mb-1 opacity-60">Équipe</div>
                  <div
                    className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
                    onDragOver={onDragOver}
                    onDropCapture={isManager ? onDrop(g.id) : undefined}
                  >
                    {g.memberIds.map(id=>{
                      const w = byId[id];
                      return (
                        <span key={id} draggable={isManager} onDragStart={isManager?onDragStart(id, g.id):undefined}
                          className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 cursor-grab select-none">
                          {w?.name || id}
                        </span>
                      );
                    })}
                    {!g.memberIds.length && <span className="text-xs opacity-60">Glisser ici…</span>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
