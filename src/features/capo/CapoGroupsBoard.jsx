// src/features/capo/CapoGroupsBoard.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export default function CapoGroupsBoard({ planned, workers, activities, onSave, onExportPdf }) {
  const makeGroup = (name) => ({
    id: uid(),
    name,
    members: [],                         // [{ uid, wid }]
    activityId: activities[0]?.id || "altro",
    defaults: { hours: 8, qtyDisplay: "", note: "" },
  });

  const [groups, setGroups] = useState([makeGroup("A"), makeGroup("B"), makeGroup("C")]);

  // valeurs par affectation (uid)
  const [perAssign, setPerAssign] = useState({}); // { [assignUid]: { hours, qtyDisplay, note } }
  const pmOf = (auid, g) => perAssign[auid] || { ...(g?.defaults || { hours:8, qtyDisplay:"", note:"" }) };
  const setPM = (auid, patch) => setPerAssign(prev => ({ ...prev, [auid]: { ...(prev[auid]||{}), ...patch }}));

  // liste non assignés : un opérateur disparaît s'il a au moins une affectation
  const assignedWids = useMemo(()=> new Set(groups.flatMap(g=>g.members.map(m=>m.wid))), [groups]);
  const unassigned = (planned.team || []).filter(id => !assignedWids.has(id));

  // --------- Drag & drop ----------
  const [drag, setDrag] = useState(null);
  const onDragStartPool = (wid) => (e) => { try{ e.dataTransfer.setData("text/plain", JSON.stringify({type:"pool", wid})); }catch{} setDrag({ type:"pool", wid }); };
  const onDragStartAssign = (assignUid, fromGroupId) => (e) => { try{ e.dataTransfer.setData("text/plain", JSON.stringify({type:"assign", assignUid, fromGroupId})); }catch{} setDrag({ type:"assign", assignUid, fromGroupId }); };
  const onDragOver = (e) => e.preventDefault();

  const addAssign = (gid, wid, cloneFromUid=null) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const auid = uid();
      const next = { uid: auid, wid };
      // cloner valeurs si demandé
      if (cloneFromUid) setPM(auid, { ...pmOf(cloneFromUid) });
      return { ...g, members: [...g.members, next] };
    }));
  };

  const moveAssign = (assignUid, fromGroupId, toGroupId) => {
    if (fromGroupId === toGroupId) return;
    let mem = null;
    setGroups(prev => prev.map(g => {
      if (g.id === fromGroupId) {
        const keep = g.members.filter(m => m.uid !== assignUid);
        mem = g.members.find(m => m.uid === assignUid) || null;
        return { ...g, members: keep };
      }
      return g;
    }));
    if (mem) {
      setGroups(prev => prev.map(g => g.id===toGroupId ? ({ ...g, members: [...g.members, mem] }) : g));
    }
  };

  const onDropToGroup = (gid) => (e) => {
    e.preventDefault();
    let payload = drag;
    try { if (!payload) payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch {}
    if (!payload) return;

    if (payload.type === "pool" && payload.wid) {
      // créer une NOUVELLE affectation (permet les doubles, triples…)
      addAssign(gid, payload.wid, null);
    }
    if (payload.type === "assign" && payload.assignUid) {
      moveAssign(payload.assignUid, payload.fromGroupId, gid);
    }
    setDrag(null);
  };

  const onDropToUnassigned = (e) => {
    e.preventDefault();
    let payload = drag;
    try { if (!payload) payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch {}
    if (payload?.type === "assign" && payload.assignUid && payload.fromGroupId) {
      // supprimer l'affectation => l'opérateur redevient "pool" s'il n'a plus d'autres affectations
      setGroups(prev => prev.map(g => g.id===payload.fromGroupId ? ({ ...g, members: g.members.filter(m=>m.uid!==payload.assignUid) }) : g));
    }
    setDrag(null);
  };

  const setField = (gid, patch) => setGroups(prev => prev.map(g => g.id===gid ? { ...g, ...patch } : g));
  const addGroup = () => setGroups(prev => [...prev, makeGroup(String.fromCharCode(65 + prev.length))]);
  const removeGroup = (gid) => setGroups(prev => prev.filter(g => g.id !== gid));

  // --------- rows pour parent/PDF ----------
  const rows = groups.flatMap(g =>
    g.members.map(m => {
      const pm = pmOf(m.uid, g);
      return {
        id: m.wid,
        group: g.name,
        activityId: g.activityId,
        hours: Number(pm.hours)||0,
        qtyDisplay: String(pm.qtyDisplay||""),
        note: String(pm.note||"")
      };
    })
  ).concat(
    // Non assignés => activité par défaut, 0h
    (planned.team||[]).filter(id => !assignedWids.has(id)).map(id => ({
      id, group: "-", activityId: activities[0]?.id || "altro", hours: 0, qtyDisplay: "", note: ""
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
                onDragStart={onDragStartPool(id)}
                className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 cursor-grab select-none"
              >
                {w?.name || id}
              </span>
            );
          })}
          {!unassigned.length && <span className="text-xs opacity-60">— Glisser ici pour retirer une affectation —</span>}
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
              {g.members.map((m, idx) => {
                const w = workers.find(x=>x.id===m.wid);
                const pm = pmOf(m.uid, g);
                return (
                  <div key={m.uid} className="grid grid-cols-12 items-center gap-2">
                    <span
                      draggable
                      onDragStart={onDragStartAssign(m.uid, g.id)}
                      title="Glisser pour déplacer / déposer dans 'Non assignés' pour retirer"
                      className="col-span-12 md:col-span-3 px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 cursor-grab select-none"
                    >
                      {w?.name || m.wid}
                    </span>
                    <div className="col-span-4 md:col-span-2">
                      <label className="text-[10px] opacity-60">Ore (h)</label>
                      <input
                        type="number"
                        className="w-full border rounded-xl px-2 py-1"
                        min={0} max={16}
                        value={pm.hours}
                        onChange={(e)=>setPM(m.uid, { hours: Math.max(0, Math.min(16, Number(e.target.value)||0)) })}
                      />
                    </div>
                    <div className="col-span-8 md:col-span-4">
                      <label className="text-[10px] opacity-60">Prodotto (Quantità)</label>
                      <input
                        className="w-full border rounded-xl px-2 py-1"
                        placeholder="es: 300 mt / 25 pz"
                        value={pm.qtyDisplay}
                        onChange={(e)=>setPM(m.uid, { qtyDisplay: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="text-[10px] opacity-60">Note</label>
                      <input
                        className="w-full border rounded-xl px-2 py-1"
                        placeholder="-"
                        value={pm.note}
                        onChange={(e)=>setPM(m.uid, { note: e.target.value })}
                      />
                    </div>
                    {/* bouton duplicata pour binôme */}
                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                      <button
                        className="text-xs px-2 py-1 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10"
                        title="Dupliquer cette affectation (binôme)"
                        onClick={()=>addAssign(g.id, m.wid, m.uid)}
                      >
                        Dup
                      </button>
                    </div>
                  </div>
                );
              })}
              {!g.members.length && <span className="text-xs opacity-60">Glisser ici…</span>}
            </div>

            {/* ajout manuel (permet d'ajouter un même opérateur plusieurs fois) */}
            <div className="mt-2">
              <select
                className="w-full text-sm border rounded-xl px-2 py-1"
                defaultValue=""
                onChange={(e)=>{ const wid=e.target.value; if(wid){ addAssign(g.id, wid, null); e.target.value=""; } }}
              >
                <option value="">+ Ajouter un opérateur…</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
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
