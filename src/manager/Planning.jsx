import React, { useMemo, useState } from "react";
import { useAppStore, planKey } from "../store/app.js";
import workersList from "../data/workers.js";
import { formatISODateKey, weekdaysFor } from "../utils/dates.js";

export default function ManagerPlanning() {
  const { tasks, impianti, capi, plans, upsertPlan, updatePlan, closeByManager, copyFromTo } = useAppStore();

  const [activeDay, setActiveDay] = useState(formatISODateKey(new Date()));
  const days = useMemo(() => weekdaysFor(new Date()), []);
  const [capoName, setCapoName] = useState(capi[0]?.name || "");

  const key = planKey(activeDay, capoName);
  const plan = plans[key] || {
    dayKey: activeDay,
    capoName,
    taskId: "",
    impianto: "",
    includeCapo: true,
    team: [],
    closedByManager: false,
  };

  const setField = (patch) => upsertPlan({ ...plan, ...patch });

  const addWorker = (w) => {
    if (plan.closedByManager) return;
    if (plan.team.some((x) => x.id === w.id)) return;
    setField({ team: [...plan.team, { id: w.id, name: w.name, hours: 8 }] });
  };

  const removeIdx = (i) => {
    if (plan.closedByManager) return;
    const next = [...plan.team];
    next.splice(i, 1);
    setField({ team: next });
  };

  const validate = () => {
    if (!plan.taskId) return "Choisir une tâche";
    if (!plan.impianto) return "Choisir un impianto";
    if (!plan.capoName) return "Choisir un capo";
    if ((plan.team || []).length === 0) return "Ajouter au moins 1 opérateur";
    return null;
  };

  const duplicateFromYesterday = () => {
    const idx = days.findIndex((d) => d.key === activeDay);
    if (idx <= 0) return;
    const prevDayKey = days[idx - 1].key;
    const fromKey = planKey(prevDayKey, capoName);
    copyFromTo(fromKey, key);
  };

  const task = tasks.find((t) => t.id === plan.taskId);

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="card">
        {/* Barre jours */}
        <div className="sticky top-0 bg-white/70 backdrop-blur -mx-5 px-5 py-3 rounded-t-2xl border-b">
          <div className="flex gap-2 flex-wrap">
            {days.map((d) => {
              const active = d.key === activeDay;
              return (
                <button
                  key={d.key}
                  className={`px-3 py-2 rounded-xl ${active ? "bg-indigo-600 text-white" : "bg-white border"}`}
                  onClick={() => setActiveDay(d.key)}
                >
                  <div>{d.labelShort}</div>
                  <div className="text-xs opacity-80">{d.ddmmyyyy}</div>
                </button>
              );
            })}
            <div className="ml-auto flex gap-2">
              <button className="btn btn-outline" onClick={duplicateFromYesterday}>Dupliquer J-1</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const err = validate();
                  if (err) return alert(err);
                  upsertPlan(plan);
                }}
              >
                Enregistrer
              </button>
              <button
                className="btn btn-outline"
                onClick={() => closeByManager(key)}
                disabled={plan.closedByManager}
                title={plan.closedByManager ? "Déjà clôturé" : "Verrouiller l'équipe"}
              >
                Clôturer l’équipe
              </button>
            </div>
          </div>
        </div>

        {/* Sélection capo */}
        <div className="mt-4">
          <label className="text-sm text-slate-600">Capo</label>
          <select value={capoName} onChange={(e) => setCapoName(e.target.value)} className="input w-full">
            {capi.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-sm text-slate-600">Tâche</label>
            <select
              value={plan.taskId}
              onChange={(e) => setField({ taskId: e.target.value })}
              disabled={plan.closedByManager}
              className="input w-full"
            >
              <option value="">—</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Impianto</label>
            <select
              value={plan.impianto}
              onChange={(e) => setField({ impianto: e.target.value })}
              disabled={plan.closedByManager}
              className="input w-full"
            >
              <option value="">—</option>
              {impianti.map((v, i) => (
                <option key={i} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={plan.includeCapo}
                onChange={(e) => setField({ includeCapo: e.target.checked })}
                disabled={plan.closedByManager}
              />
              Inclure le Capo (8h)
            </label>
          </div>
        </div>

        {/* Équipe (manager ajoute/retire) */}
        <div className="mt-4 space-y-3">
          {plan.team.map((p, i) => (
            <div key={p.id} className="grid md:grid-cols-[1fr_120px_100px] gap-2">
              <input value={p.name} className="input" readOnly />
              <input
                type="number"
                min={0}
                max={24}
                value={p.hours}
                onChange={(e) => {
                  const t = [...plan.team];
                  t[i] = { ...t[i], hours: Number(e.target.value) };
                  setField({ team: t });
                }}
                disabled={plan.closedByManager}
                className="input"
              />
              <button onClick={() => removeIdx(i)} disabled={plan.closedByManager} className="btn btn-danger">
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne droite — recherche/ajout opérateurs */}
      <div className="card h-fit">
        <div className="text-lg font-semibold mb-2">Opérateurs</div>
        <div className="subtitle">Ajouter à l’équipe du capo sélectionné.</div>
        <div className="max-h-[420px] overflow-auto space-y-1">
          {workersList.map((w) => (
            <div key={w.id} className="flex items-center justify-between">
              <span className="truncate">{w.name}</span>
              <button className="btn btn-outline" onClick={() => addWorker(w)} disabled={plan.closedByManager}>
                Ajouter
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
