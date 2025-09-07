// src/features/capo/CapoGroupsBoard.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function CapoGroupsBoard({ planned, workers, activities, onSave, onExportPdf }) {
  const makeGroup = (name) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name,
    members: [],           // array d'ids
    activityId: activities[0]?.id || "altro", // activité commune
    // valeurs par défaut appliquées à l'ajout d'un membre
    defaults: { hours: 8, qtyDisplay: "", note: "" },
  });

  const [groups, setGroups] = useState([makeGroup("A"), makeGroup("B"), makeGroup("C")]);

  // Pour pouvoir stocker heures/qty/note par membre, on garde un petit dictionnaire
  // { [memberId]: { hours, qtyDisplay, note } } par groupe
  const [perMember, setPerMember] = useState({}); // { [groupId]: { [memberId]: {hours, qtyDisplay, note} } }

  const getPM = (gid, mid) => perMember[gid]?.[mid] || { hours: 8, qtyDisplay: "", note: "" };
  const setPM = (gid, mid, patch) =>
    setPerMember(prev => ({
      ...prev,
      [gid]: {
        ...(prev[gid]||{}),
        [mid]: { ...getPM(gid, mid), ...patch }
      }
    }));

  const allMemberIds = useMemo(()=> new Set(groups.flatMap(g=>g.members)), [groups]);
  const unassigned = (planned.team || []).filter(id => !allMemberIds.has(id));

  const [drag, setDrag] = useState(null);
  const onDragStart = (wid, from) => (e) => { try{e.dataTransfer.setData("text/plain",wid);}catch{} setDrag({workerId: wid, fromGroupId: from}); };
  const onDragOver  = (e) => { e.preventDefault(); };
  const onDropToGroup = (gid) => (e) => {
    e.preventDefault();
    const wid = drag?.workerId || (()=>{ try{return e.dataTransfer.getData("text/plain");}catch{return null;} })();
    if (!wid) return;
    setGroups(prev => prev.map(g => {
      if (drag?.fromGroupId && g.id === drag.fromGroupId) return { ...g, members: g.members.filter(x => x !== wid) };
      if (g.id === gid) {
        // ajout si absent
        const already = g.members.includes(wid);
        const next = already ? g.members : [...g.members, wid];
        return { ...g, members: next };
      }
      // s'assurer d'unicité globale (un membre ne peut être dans 2 groupes en même temps)
      return { ...g, members: g.members.filter(x => x !== wid) };
    }));
    // init des valeurs par défaut si nouveau dans ce groupe
    setPM(gid, wid, {});
    setDrag(null);
  };
  const onDropToUnassigned = (e) => {
    e.preventDefault();
    const wid = drag?.workerId || (()=>{ try{return e.dataTransfer.getData("text/plain");}catch{return null;} })();
    if (!wid) return;
    setGroups(prev => prev.map(g => ({ ...g, members: g.members.filter(x => x !== wid) })));
    setDrag(null);
  };

  const setField = (gid, patch) => setGroups(prev => prev.map(g => g.id===gid ? { ...g, ...patch } : g));
  const addGroup = () => setGroups(prev => [...prev, makeGroup(String.fromCharCode(65 + prev.length))]);
  const removeGroup = (gid) => {
    setGroups(prev => prev.filter(g => g.id !== gid));
    setPerMember(prev => {
      const { [gid]:_, ...rest } = prev;
      return rest;
    });
  };

  // Construire les rows envoyés au parent
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
    // Non assignés : activité par défaut, 0h / 0 qty, note vide
    unassigned.map(id => ({
      id,
      group: "-",
      activityId: activities[0]?.id || "altro",
      hours: 0,
      qtyDisplay: "",
      note: ""
    }))
  );

  const totalHours = rows.reduce((s,r)=> s + (Number(r.hours)||0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm font-medium mb-2">Non assignés</div>
        <div
          className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
          onDragOver={onDragOver}
          onDrop={onDropToUnassigned}
        >
          {unassigned.map(id => {
            const w = workers.find(x=>x.id===id);
            return (
              <span key={id}
                draggable
                onDragStart={onDragStart(id, null)}
                className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 cursor-grab select-none"
              >
                {w?.name || id}
              </span>
            );
          })}
          {!unassigned.length && <span className="text-xs opacity-60">— Glisser ici pour retirer d'un groupe —</span>}
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
                <select
                  className="w-full border rounded-xl px-2 py-1"
                  value={g.activityId}
                  onChange={(e)=>setField(g.id,{activityId: e.target.value})}
                >
                  {activities.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="opacity-70 text-xs flex items-end">Tous les membres partagent cette activité.</div>
            </div>

            <div className="text-xs uppercase tracking-wide mt-3 mb-1 opacity-60">Membres (Operatore)</div>
            <div
              className="flex flex-col gap-2 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
              onDragOver={onDragOver}
              onDrop={onDropToGroup(g.id)}
            >
              {g.members.map(id => {
                const w = workers.find(x=>x.id===id);
                const pm = getPM(g.id, id);
                return (
                  <div key={id} className="grid grid-cols-12 items-center gap-2">
                    <span
                      draggable
                      onDragStart={onDragStart(id, g.id)}
                      className="col-span-12 md:col-span-3 px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 cursor-grab select-none"
                    >
                      {w?.name || id}
                    </span>
                    <div className="col-span-4 md:col-span-2">
                      <label className="text-[10px] opacity-60">Ore (h)</label>
                      <input
                        type="number"
                        className="w-full border rounded-xl px-2 py-1"
                        min={0} max={16}
                        value={pm.hours}
                        onChange={(e)=>setPM(g.id, id, { hours: Math.max(0, Math.min(16, Number(e.target.value)||0)) })}
                      />
                    </div>
                    <div className="col-span-8 md:col-span-4">
                      <label className="text-[10px] opacity-60">Quantità (fatto)</label>
                      <input
                        className="w-full border rounded-xl px-2 py-1"
                        placeholder="ex: 280 mt / 22 pz"
                        value={pm.qtyDisplay}
                        onChange={(e)=>setPM(g.id, id, { qtyDisplay: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="text-[10px] opacity-60">Note</label>
                      <input
                        className="w-full border rounded-xl px-2 py-1"
                        placeholder="-"
                        value={pm.note}
                        onChange={(e)=>setPM(g.id, id, { note: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-0" />
                  </div>
                );
              })}
              {!g.members.length && <span className="text-xs opacity-60">Glisser ici…</span>}
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
