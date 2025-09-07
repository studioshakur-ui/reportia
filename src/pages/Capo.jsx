import React from "react";

export default function Capo({ tasks, impianti, capi, managerData }) {
  const keys = Object.keys(managerData).sort();
  if (keys.length === 0) return <div className="mt-6 text-slate-600">Aucun rapport enregistré.</div>;

  return (
    <div className="mt-6 space-y-4">
      {keys.map((k) => {
        const v = managerData[k];
        const task = tasks.find((t) => t.id === v.taskId);
        return (
          <div key={k} className="bg-white rounded-2xl p-5 shadow">
            <div className="font-semibold text-slate-700 mb-2">
              {k} • {v.impianto || "-"} • {task?.name || "-"} • Capo: {v.capoName || "-"}
            </div>
            <ul className="text-sm text-slate-600 list-disc pl-6">
              {(v.team || []).map((p, i) => (
                <li key={i}>
                  {p.name} — {p.hours ?? 0}h{p.activity ? ` — ${p.activity}` : ""}{p.qty ? ` — ${p.qty}pz` : ""}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
