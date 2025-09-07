// src/features/capo/CapoGroupsBoard.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function CapoGroupsBoard({ planned, workers, activities, onSave, onExportPdf }) {
  const makeGroup = (name) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name,
    members: [],
    activityId: activities[0]?.id || "altro",
    defaults: { hours: 8, qtyDisplay: "", note: "" },
  });

  const [groups, setGroups] = useState([makeGroup("A"), makeGroup("B"), makeGroup("C")]);
  const [perMember, setPerMember] = useState({}); // { [groupId]: { [memberId]: { hours, qtyDisplay, note } } }
  const getPM = (gid, mid) => perMember[gid]?.[mid] || { hours: 8, qtyDisplay: "", note: "" };
  const setPM = (gid, mid, patch) =>
    setPerMember(prev => ({ ...prev, [gid]: { ...(prev[gid]||{}), [mid]: { ...getPM(gid, mid), ...patch } } }));

  // NB: ici on n'interdit plus les doublons (un opérateur peut être présent dans 2 groupes)
  const allMemberIds = useMemo(()=> new Set(groups.flatMap(g=>g.members)), [groups]);
  const unassigned = (planned.team || []).filter(id => !allMemberIds.has(id));

  // Ajout/Suppression via menus (mobile OK)
  const addMemberToGroup = (gid, id) => {
    if (!id) return;
    setGroups(prev => prev.map(g => g.id===gid ? { ...g, members: [...g.members, id] } : g));
    setPM(gid, id, {});
  };
  const removeMemberFromGroup = (gid, id) => {
    setGroups(prev => prev.map(g => g.id===gid ? { ...g, members: g.members.filter(x=>x!==id) } : g));
  };

  const setField = (gid, patch) => setGroups(prev => prev.map(g => g.id===gid ? { ...g, ...patch } : g));
  const addGroup = () => setGroups(prev => [...prev, makeGroup(String.fromCharCode(65 + prev.length))]);
  const removeGroup = (gid) => {
    setGroups(prev => prev.filter(g => g.id !== gid));
    setPerMember(prev => { const { [gid]:_, ...rest } = prev; return rest; });
  };

  const rows = groups.flatMap(g =>
    g.members.map(id => {
      const pm = getPM(g.id, id);
      return {
        id,
        group: g.name,
        activityId: g.activityId,
        hours: Number(pm.hours) || 0,
        qtyDisplay: String(pm.qtyDisplay || ""),
        note: String(pm.note || "")
      };
    })
  ).concat(
    unassigned.map(id => ({ id, group: "-", activityId: activities[0]?.id || "altro", hours: 0, qtyDisplay: "", note: "" }))
  );

  const totalHours = rows.reduce((s,r)=> s + (Number(r.hours)||0), 0);

  const operaiMap = new Map(workers.map(w=>[w.id,w]));

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm font-medium mb-2">Non assignés</div>
        <div className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2">
          {unassigned.map(id => (
            <span key={id} className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 select-none">
              {operaiMap.get(id)?.name || id}
            </span>
          ))}
          {!unassigned.length && <span className="text-xs opacity-60">— Personne —</span>}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {groups.map(g => (
          <Card key={g.id}>
            <div className="flex items-center justify-between">
              <input className="font-semibold bg-transparent outline-none" value={g.name} onChange={e=>setField(g.id,{name:e.target.value})} />
              <Button size="sm" variant="danger" onClick={()=>removeGroup(g.id)}>Suppr</Button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-xs opacity-70">Attività (commune)</label>
                <select className="w-full border rounded-xl px-2 py-1" value={g.activityId} onChange={(e)=>setField(g.id,{activityId: e.target.value})}>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="opacity-70 text-xs flex items-end">Tous les membres partagent cette activité.</div>
            </div>

            <div className="text-xs uppercase tracking-wide mt-3 mb-1 opacity-60">Ajouter un membre</div>
            <div className="flex gap-2">
              <select className="flex-1 border rounded-xl px-2 py-1" defaultValue="" onChange={(e)=>{ addMemberToGroup(g.id, e.target.value); e.target.value=''; }}>
                <option value="">— Choisir —</option>
                {(planned.team || []).filter(id => true /* on permet doublon */).map(id => (
                  <option key={`${g.id}-${id}`} value={id}>{operaiMap.get(id)?.name || id}</option>
                ))}
              </select>
            </div>

            <div className="text-xs uppercase tracking-wide mt-3 mb-1 opacity-60">Membres</div>
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2">
              {g.members.map(id => {
                const w = operaiMap.get(id);
                const pm = getPM(g.id, id);
                return (
                  <div key={`${g.id}-${id}`} className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-12 md:col-span-3 px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 select-none">
                      {w?.name || id}
                    </span>
                    <div className="col-span-4 md:col-span-2">
                      <label className="text-[10px] opacity-60">Ore (h)</label>
                      <input type="number" className="w-full border rounded-xl px-2 py-1" min={0} max={16}
                             value={pm.hours} onChange={(e)=>setPM(g.id, id, { hours: Math.max(0, Math.min(16, Number(e.target.value)||0)) })} />
                    </div>
                    <div className="col-span-8 md:col-span-4">
                      <label className="text-[10px] opacity-60">Quantità (fatto)</label>
                      <input className="w-full border rounded-xl px-2 py-1" placeholder="ex: 280 mt / 22 pz"
                             value={pm.qtyDisplay} onChange={(e)=>setPM(g.id, id, { qtyDisplay: e.target.value })} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="text-[10px] opacity-60">Note</label>
                      <input className="w-full border rounded-xl px-2 py-1" placeholder="-"
                             value={pm.note} onChange={(e)=>setPM(g.id, id, { note: e.target.value })} />
                    </div>
                    <div className="col-span-12 md:col-span-0">
                      <button className="text-rose-600 text-xs font-semibold hover:underline" onClick={()=>removeMemberFromGroup(g.id, id)}>Retirer</button>
                    </div>
                  </div>
                );
              })}
              {!g.members.length && <span className="text-xs opacity-60">— Aucun membre —</span>}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addGroup}>Ajouter un groupe</Button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10">Total heures : {totalHours}h</span>
          <Button variant="outline" onClick={()=>onSave(rows)}>Enregistrer</Button>
          <Button onClick={()=>onExportPdf(rows)}>Exporter PDF</Button>
        </div>
      </div>
    </div>
  );
}
