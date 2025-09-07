import React, { useMemo, useState } from "react";
import workersList from "../data/workers.js";

export default function PlannerForm({ tasks, impianti, capi, value, onChange }) {
  const [search, setSearch] = useState("");
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workersList;
    return workersList.filter((w) => w.name.toLowerCase().includes(q));
  }, [search]);

  const task = tasks.find((t) => t.id === value.taskId);
  const defaultActivity = task?.name || "";

  const setField = (patch) => onChange({ ...value, ...patch });

  const addFirst = () => {
    if (results.length === 0) return;
    const person = results[0];
    setField({
      team: [...(value.team || []), { id: person.id, name: person.name, hours: 8, activity: defaultActivity, qty: 0 }],
    });
  };

  const updatePerson = (idx, patch) => {
    const next = [...(value.team || [])];
    next[idx] = { ...next[idx], ...patch };
    setField({ team: next });
  };

  const removePerson = (idx) => {
    const next = [...(value.team || [])];
    next.splice(idx, 1);
    setField({ team: next });
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-600">Tâche</label>
          <select value={value.taskId || ""} onChange={(e) => setField({ taskId: e.target.value })} className="input w-full">
            <option value="">—</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-600">Impianto</label>
          <select value={value.impianto || ""} onChange={(e) => setField({ impianto: e.target.value })} className="input w-full">
            <option value="">—</option>
            {impianti.map((v, i) => (
              <option key={i} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-600">Capo Squadra</label>
          <select value={value.capoName || ""} onChange={(e) => setField({ capoName: e.target.value })} className="input w-full">
            <option value="">—</option>
            {capi.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" checked={!!value.includeCapo} onChange={(e) => setField({ includeCapo: e.target.checked })} />
            Inclure le Capo dans l’équipe (compte heures)
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un operaio…" className="input flex-1" />
        <div className="text-slate-500 text-sm">Résultats: {results.length}</div>
        <button onClick={addFirst} className="btn btn-outline">+ Ajouter le 1er</button>
      </div>

      <div className="mt-4 space-y-3">
        {(value.team || []).map((p, idx) => (
          <div key={idx} className="grid md:grid-cols-[1fr_110px_1fr_110px_90px] gap-2">
            <select
              value={p.id}
              onChange={(e) => {
                const w = workersList.find((x) => x.id === e.target.value);
                if (w) updatePerson(idx, { id: w.id, name: w.name });
              }}
              className="input"
            >
              {workersList.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <input type="number" min={0} max={24} value={p.hours ?? 8} onChange={(e) => updatePerson(idx, { hours: Number(e.target.value) })} className="input" />
            <input value={p.activity || defaultActivity} onChange={(e) => updatePerson(idx, { activity: e.target.value })} className="input" />
            <input type="number" min={0} value={p.qty ?? 0} onChange={(e) => updatePerson(idx, { qty: Number(e.target.value) })} className="input" />

            <button onClick={() => removePerson(idx)} className="btn btn-danger">Retirer</button>
          </div>
        ))}
      </div>
    </>
  );
}
