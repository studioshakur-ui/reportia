// src/features/capo/CapoGroupsBoard.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

function DraggableChip({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`px-2 py-1 rounded-full text-xs select-none cursor-grab bg-black/5 dark:bg-white/10 ${isDragging ? "opacity-70 ring-2 ring-indigo-400" : ""}`}
    >
      {label}
    </span>
  );
}

function DropZone({ id, className = "", children, onDropHere }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "ring-2 ring-indigo-400" : ""}`}
    >
      {children}
    </div>
  );
}

export default function CapoGroupsBoard({ planned, workers, activities, onSave, onExportPdf }) {
  const makeGroup = (name) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    members: [],
    activityId: activities[0]?.id || "altro",
    defaults: { hours: 8, qtyDisplay: "", note: "" },
  });

  const [groups, setGroups] = useState([makeGroup("A"), makeGroup("B"), makeGroup("C")]);

  const [perMember, setPerMember] = useState({}); // { [groupId]: { [memberId]: {hours, qtyDisplay, note} } }
  const getPM = (gid, mid) => perMember[gid]?.[mid] || { hours: 8, qtyDisplay: "", note: "" };
  const setPM = (gid, mid, patch) =>
    setPerMember((prev) => ({
      ...prev,
      [gid]: {
        ...(prev[gid] || {}),
        [mid]: { ...getPM(gid, mid), ...patch },
      },
    }));

  const allMemberIds = useMemo(() => new Set(groups.flatMap((g) => g.members)), [groups]);
  const unassigned = (planned.team || []).filter((id) => !allMemberIds.has(id));

  // Sensors pointer (mobile+desktop)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(PointerSensor)
  );

  const handleDragEnd = (evt) => {
    const wid = evt.active?.id;
    const overId = evt.over?.id; // "unassigned" ou "group:<gid>"
    if (!wid || !overId) return;

    if (overId === "unassigned") {
      // retirer de tous les groupes
      setGroups((prev) => prev.map((g) => ({ ...g, members: g.members.filter((x) => x !== wid) })));
      return;
    }
    if (overId.startsWith("group:")) {
      const gid = overId.slice(6);
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === gid) {
            const next = g.members.includes(wid) ? g.members : [...g.members, wid];
            return { ...g, members: next };
          }
          // garantir unicité globale
          return { ...g, members: g.members.filter((x) => x !== wid) };
        })
      );
      // init PM
      setPM(gid, wid, {});
    }
  };

  const setField = (gid, patch) =>
    setGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  const addGroup = () =>
    setGroups((prev) => [...prev, makeGroup(String.fromCharCode(65 + prev.length))]);
  const removeGroup = (gid) => {
    setGroups((prev) => prev.filter((g) => g.id !== gid));
    setPerMember((prev) => {
      const { [gid]: _drop, ...rest } = prev;
      return rest;
    });
  };

  const rows = groups
    .flatMap((g) =>
      g.members.map((id) => {
        const pm = getPM(g.id, id);
        return {
          id,
          group: g.name,
          activityId: g.activityId,
          hours: Number(pm.hours) || 0,
          qtyDisplay: String(pm.qtyDisplay || ""),
          note: String(pm.note || ""),
        };
      })
    )
    .concat(
      unassigned.map((id) => ({
        id,
        group: "-",
        activityId: activities[0]?.id || "altro",
        hours: 0,
        qtyDisplay: "",
        note: "",
      }))
    );

  const totalHours = rows.reduce((s, r) => s + (Number(r.hours) || 0), 0);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <Card>
          <div className="text-sm font-medium mb-2">Non assignés</div>
          <DropZone
            id="unassigned"
            className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
          >
            {unassigned.map((id) => {
              const w = workers.find((x) => x.id === id);
              return <DraggableChip key={id} id={id} label={w?.name || id} />;
            })}
            {!unassigned.length && (
              <span className="text-xs opacity-60">— Glisser ici pour retirer d'un groupe —</span>
            )}
          </DropZone>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <div className="flex items-center justify-between">
                <input
                  className="font-semibold bg-transparent outline-none"
                  value={g.name}
                  onChange={(e) => setField(g.id, { name: e.target.value })}
                />
                <Button size="sm" variant="danger" onClick={() => removeGroup(g.id)}>
                  Suppr
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="text-xs opacity-70">Attività (commune)</label>
                  <select
                    className="w-full border rounded-xl px-2 py-1"
                    value={g.activityId}
                    onChange={(e) => setField(g.id, { activityId: e.target.value })}
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="opacity-70 text-xs flex items-end">
                  Tous les membres partagent cette activité.
                </div>
              </div>

              <div className="text-xs uppercase tracking-wide mt-3 mb-1 opacity-60">
                Membres (Operatore)
              </div>

              <DropZone
                id={`group:${g.id}`}
                className="flex flex-col gap-2 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2"
              >
                {g.members.map((id) => {
                  const w = workers.find((x) => x.id === id);
                  const pm = getPM(g.id, id);
                  return (
                    <div key={id} className="grid grid-cols-12 items-center gap-2">
                      <DraggableChip id={id} label={w?.name || id} />

                      <div className="col-span-4 md:col-span-2">
                        <label className="text-[10px] opacity-60">Ore (h)</label>
                        <input
                          type="number"
                          className="w-full border rounded-xl px-2 py-1"
                          min={0}
                          max={16}
                          value={pm.hours}
                          onChange={(e) =>
                            setPM(g.id, id, {
                              hours: Math.max(0, Math.min(16, Number(e.target.value) || 0)),
                            })
                          }
                        />
                      </div>
                      <div className="col-span-8 md:col-span-4">
                        <label className="text-[10px] opacity-60">Quantità (fatto)</label>
                        <input
                          className="w-full border rounded-xl px-2 py-1"
                          placeholder="ex: 280 mt / 22 pz"
                          value={pm.qtyDisplay}
                          onChange={(e) => setPM(g.id, id, { qtyDisplay: e.target.value })}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-3">
                        <label className="text-[10px] opacity-60">Note</label>
                        <input
                          className="w-full border rounded-xl px-2 py-1"
                          placeholder="-"
                          value={pm.note}
                          onChange={(e) => setPM(g.id, id, { note: e.target.value })}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-0" />
                    </div>
                  );
                })}
                {!g.members.length && <span className="text-xs opacity-60">Glisser ici…</span>}
              </DropZone>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={addGroup}>
            Ajouter un groupe
          </Button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10">
              Total heures : {totalHours}h
            </span>
            <Button variant="outline" onClick={() => onSave(rows)}>
              Enregistrer
            </Button>
            <Button onClick={() => onExportPdf(rows)}>Exporter PDF</Button>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
