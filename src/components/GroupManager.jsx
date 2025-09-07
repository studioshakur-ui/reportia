import React from "react";
import CapoSelect from "./CapoSelect.jsx";

export default function GroupManager({ groups, setGroups, capi }) {
  const setCapo = (groupId, capoId) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, capoId } : g))
    );
  };

  const setTask = (groupId, task) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, task } : g))
    );
  };

  return (
    <section style={{ marginBottom: 16 }}>
      <h2 className="title">Groupes</h2>
      <div className="row">
        {groups.map((g) => (
          <div className="card" key={g.id}>
            <strong>{g.name}</strong>
            <div style={{ marginTop: 8 }}>
              <label className="muted">Capo squadra</label>
              <CapoSelect
                value={g.capoId}
                onChange={(v) => setCapo(g.id, v)}
                options={capi}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label className="muted">Attività / tâche</label>
              <input
                value={g.task || ""}
                onChange={(e) => setTask(g.id, e.target.value)}
                placeholder="ex: Estesura cavi, Lampade..."
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
