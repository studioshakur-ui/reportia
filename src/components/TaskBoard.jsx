import React, { useState } from "react";
import WorkerCard from "./WorkerCard.jsx";

export default function TaskBoard({
  groups,
  setGroups,
  workers,
  unassignedIds,
  setWorkerHours,
}) {
  const [dragId, setDragId] = useState(null);

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id);
    e.currentTarget.classList.add("dragging");
  };
  const onDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
  };

  const dropToGroup = (e, groupId) => {
    e.preventDefault();
    const wid = dragId || e.dataTransfer.getData("text/plain");
    if (!wid) return;
    setGroups((prev) =>
      prev.map((g) => {
        let members = g.memberIds || [];
        members = members.filter((id) => id !== wid);
        if (g.id === groupId) {
          members = [...members, wid];
        }
        return { ...g, memberIds: members };
      })
    );
    setDragId(null);
  };

  const dropToUnassigned = (e) => {
    e.preventDefault();
    const wid = dragId || e.dataTransfer.getData("text/plain");
    if (!wid) return;
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        memberIds: (g.memberIds || []).filter((id) => id !== wid),
      }))
    );
    setDragId(null);
  };

  const prevent = (e) => e.preventDefault();

  const renderWorker = (id) => {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return null;
    return (
      <WorkerCard
        key={id}
        worker={worker}
        onDragStart={onDragStart}
        setHours={setWorkerHours}
        onDragEnd={onDragEnd}
      />
    );
  };

  return (
    <section>
      <h2 className="title">Affectations (glisser-déposer)</h2>
      <div className="row">
        <div className="col" onDrop={dropToUnassigned} onDragOver={prevent}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Non assignés</div>
          {unassignedIds.map(renderWorker)}
        </div>
        {groups.map((g) => (
          <div
            key={g.id}
            className="col"
            onDrop={(e) => dropToGroup(e, g.id)}
            onDragOver={prevent}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>{g.name}</div>
              <div className="muted">{g.task || "Aucune activité"}</div>
            </div>
            {(g.memberIds || []).map(renderWorker)}
          </div>
        ))}
      </div>
    </section>
  );
}
