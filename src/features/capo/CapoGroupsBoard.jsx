// src/features/capo/CapoGroupsBoard.jsx
import React, { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";

import {
  DndContext,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* --------- Draggable item (Operatore) ---------- */
function MemberChip({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 text-text cursor-grab select-none touch-none ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      {label}
    </div>
  );
}

/* --------- Utils DnD multi-conteneurs ---------- */
function findContainerId(itemId, containersMap) {
  for (const [cid, arr] of Object.entries(containersMap)) {
    if (arr.includes(itemId)) return cid;
  }
  return null;
}

function removeFromArray(arr, id) {
  const i = arr.indexOf(id);
  if (i === -1) return arr;
  const next = arr.slice();
  next.splice(i, 1);
  return next;
}

export default function CapoGroupsBoard({
  planned,
  workers,
  activities,
  onSave,
  onExportPdf,
}) {
  const makeGroup = (name) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    members: [], // array d'ids
    activityId: activities[0]?.id || "altro", // activité commune
    // valeurs par défaut appliquées à l'ajout d'un membre (si tu veux t'en servir plus tard)
    defaults: { hours: 8, qtyDisplay: "", note: "" },
  });

  const [groups, setGroups] = useState([
    makeGroup("A"),
    makeGroup("B"),
    makeGroup("C"),
  ]);

  // heures/quantité/note par membre et par groupe : { [groupId]: { [memberId]: {hours, qtyDisplay, note} } }
  const [perMember, setPerMember] = useState({});
  const getPM = (gid, mid) =>
    perMember[gid]?.[mid] || { hours: 8, qtyDisplay: "", note: "" };
  const setPM = (gid, mid, patch) =>
    setPerMember((prev) => ({
      ...prev,
      [gid]: {
        ...(prev[gid] || {}),
        [mid]: { ...getPM(gid, mid), ...patch },
      },
    }));

  // Équipe prévue par le manager
  const allMemberIds = useMemo(
    () => new Set(groups.flatMap((g) => g.members)),
    [groups]
  );
  const unassigned = (planned.team || []).filter((id) => !allMemberIds.has(id));

  // ---- DnD sensors (souris + tactile) ----
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );

  // ---- État de drag en cours (pour l'overlay) ----
  const [activeId, setActiveId] = useState(null);

  // Map des conteneurs -> items (non assignés + chaque groupe)
  const containers = useMemo(() => {
    const map = { unassigned: unassigned.slice() };
    for (const g of groups) map[g.id] = g.members.slice();
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, unassigned.join("|")]);

  function setContainersToGroups(nextContainers) {
    // Reconstruit l'état des groupes à partir du mapping conteneurs->items
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        members: nextContainers[g.id] ? nextContainers[g.id].slice() : [],
      }))
    );
  }

  function onDragStart(e) {
    setActiveId(e.active.id);
    document.documentElement.classList.add("dragging"); // iOS scroll calmé
  }

  function onDragCancel() {
    setActiveId(null);
    document.documentElement.classList.remove("dragging");
  }

  function onDragEnd(e) {
    const { active, over } = e;
    setActiveId(null);
    document.documentElement.classList.remove("dragging");
    if (!over) return;

    const activeItem = active.id; // worker id
    const overId = over.id;

    // Trouver conteneurs source et destination
    const fromContainer = findContainerId(activeItem, containers);
    let toContainer = findContainerId(overId, containers);
    if (!toContainer) {
      // Si on drop sur un conteneur vide, overId est l'id du conteneur
      if (containers[overId]) toContainer = overId;
    }
    if (!fromContainer || !toContainer) return;

    // Indices pour tri intra-liste
    const fromItems = containers[fromContainer];
    const toItems = containers[toContainer];
    const fromIndex = fromItems.indexOf(activeItem);
    const overIndex = toItems.indexOf(overId);

    // Copie du mapping
    const next = Object.fromEntries(
      Object.entries(containers).map(([cid, arr]) => [cid, arr.slice()])
    );

    if (fromContainer === toContainer) {
      // Réordonnancement dans la même liste
      const newIndex = overIndex >= 0 ? overIndex : toItems.length - 1;
      next[toContainer] = arrayMove(toItems, fromIndex, newIndex);
    } else {
      // Déplacement entre listes
      next[fromContainer] = removeFromArray(next[fromContainer], activeItem);
      const insertAt = overIndex >= 0 ? overIndex : next[toContainer].length;
      // S'assurer d'unicité globale
      next[toContainer] = next[toContainer].filter((id) => id !== activeItem);
      next[toContainer].splice(insertAt, 0, activeItem);

      // Nettoyer l'ancien PM si on quitte un groupe
      if (fromContainer !== "unassigned") {
        setPerMember((prev) => {
          const gpm = { ...(prev[fromContainer] || {}) };
          delete gpm[activeItem];
          const rest = { ...prev, [fromContainer]: gpm };
          return rest;
        });
      }
      // Initialiser PM dans le nouveau groupe
      if (toContainer !== "unassigned") {
        setPM(toContainer, activeItem, {});
      }
    }

    // Refléter dans l'état des groupes
    setContainersToGroups(next);
  }

  // ---- Ajout / suppression groupes ----
  const addGroup = () =>
    setGroups((prev) => [
      ...prev,
      makeGroup(String.fromCharCode(65 + prev.length)),
    ]);

  const removeGroup = (gid) => {
    setGroups((prev) => prev.filter((g) => g.id !== gid));
    setPerMember((prev) => {
      const { [gid]: _, ...rest } = prev;
      return rest;
    });
  };

  // ---- Payload export/save identique à ta logique d'origine ----
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
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        {/* === NON ASSIGNÉS === */}
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium mb-2">Non assignés</div>
            <SortableContext items={containers.unassigned} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-2 min-h-[48px] rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2">
                {containers.unassigned.length === 0 && (
                  <span className="text-xs opacity-70">
                    — Glisser ici pour retirer d&apos;un groupe —
                  </span>
                )}
                {containers.unassigned.map((id) => {
                  const w = workers.find((x) => x.id === id);
                  return <MemberChip key={id} id={id} label={w?.name || id} />;
                })}
              </div>
            </SortableContext>
          </div>
        </Card>

        {/* === GROUPES === */}
        <div className="grid md:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <input
                    className="font-semibold bg-transparent outline-none rounded px-2 py-1 border border-transparent focus:border-black/10 dark:focus:border-white/10"
                    value={g.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGroups((prev) =>
                        prev.map((x) => (x.id === g.id ? { ...x, name: v } : x))
                      );
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger border-danger/20 hover:bg-danger/10"
                    onClick={() => removeGroup(g.id)}
                  >
                    Supprimer
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-xs opacity-70">Attività (commune)</label>
                    <Select
                      value={g.activityId}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((x) =>
                            x.id === g.id ? { ...x, activityId: e.target.value } : x
                          )
                        )
                      }
                    >
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="opacity-70 text-xs flex items-end">
                    Tous les membres partagent cette activité.
                  </div>
                </div>

                <div className="text-xs uppercase tracking-wide mt-3 mb-1 opacity-60">
                  Membres (Operatore)
                </div>

                <SortableContext items={containers[g.id]} strategy={rectSortingStrategy}>
                  <div className="flex flex-col gap-2 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-2">
                    {containers[g.id].length === 0 && (
                      <span className="text-xs opacity-70">Glisser ici…</span>
                    )}

                    {containers[g.id].map((id) => {
                      const w = workers.find((x) => x.id === id);
                      const pm = getPM(g.id, id);
                      return (
                        <div key={id} className="grid grid-cols-12 items-center gap-2">
                          {/* Handle draggable */}
                          <div className="col-span-12 md:col-span-3">
                            <MemberChip id={id} label={w?.name || id} />
                          </div>

                          <div className="col-span-4 md:col-span-2">
                            <label className="text-[10px] opacity-60">Ore (h)</label>
                            <input
                              type="number"
                              className="w-full border border-black/10 dark:border-white/10 rounded-xl2 px-2 py-1 bg-surface text-text"
                              min={0}
                              max={16}
                              value={pm.hours}
                              onChange={(e) =>
                                setPM(g.id, id, {
                                  hours: Math.max(
                                    0,
                                    Math.min(16, Number(e.target.value) || 0)
                                  ),
                                })
                              }
                            />
                          </div>

                          <div className="col-span-8 md:col-span-4">
                            <label className="text-[10px] opacity-60">Quantità (fatto)</label>
                            <input
                              className="w-full border border-black/10 dark:border-white/10 rounded-xl2 px-2 py-1 bg-surface text-text"
                              placeholder="ex: 280 mt / 22 pz"
                              value={pm.qtyDisplay}
                              onChange={(e) =>
                                setPM(g.id, id, { qtyDisplay: e.target.value })
                              }
                            />
                          </div>

                          <div className="col-span-12 md:col-span-3">
                            <label className="text-[10px] opacity-60">Note</label>
                            <input
                              className="w-full border border-black/10 dark:border-white/10 rounded-xl2 px-2 py-1 bg-surface text-text"
                              placeholder="-"
                              value={pm.note}
                              onChange={(e) => setPM(g.id, id, { note: e.target.value })}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-0" />
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </div>
            </Card>
          ))}
        </div>

        {/* Overlay fantôme pendant le drag */}
        <DragOverlay>
          {activeId ? (
            <div className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 shadow-soft">
              {workers.find((x) => x.id === activeId)?.name || activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* === BARRE ACTIONS === */}
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
  );
}
