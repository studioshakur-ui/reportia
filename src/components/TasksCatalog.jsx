import React, { useState } from "react";
import { uid } from "../utils/storage.js";

export default function TasksCatalog({ tasks, setTasks }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState(2);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setTasks((prev) => [...prev, { id: uid(), name: n, refSize: Number(size) || 1 }]);
    setName(""); setSize(2);
  };

  const remove = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const rename = (id, v) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, name: v } : t)));
  const resize = (id, v) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, refSize: Number(v) || 1 } : t)));

  return (
    <div className="card">
      <div className="title">Catalogue — Tâches</div>
      <div className="subtitle">Ajoute / renomme / supprime les tâches. Défini aussi la taille d’équipe par défaut.</div>

      <div className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle tâche (ex: Stesura alimenti)" className="input flex-1" />
        <input type="number" min={1} value={size} onChange={(e) => setSize(e.target.value)} className="input w-20" />
        <button onClick={add} className="btn btn-primary">Ajouter</button>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex gap-2">
            <input value={t.name} onChange={(e) => rename(t.id, e.target.value)} className="input flex-1" />
            <input type="number" min={1} value={t.refSize} onChange={(e) => resize(t.id, e.target.value)} className="input w-20" />
            <button onClick={() => remove(t.id)} className="btn btn-danger">Suppr</button>
          </div>
        ))}
      </div>
    </div>
  );
}
