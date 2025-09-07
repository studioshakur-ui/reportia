import React from "react";

export default function TaskShortcuts({ tasks, onPick }) {
  return (
    <div>
      <div className="text-lg font-semibold mb-2">Raccourcis tâche</div>
      <div className="text-slate-500 text-sm mb-4">
        Ces raccourcis changent la <b>tâche</b> uniquement. L’équipe reste telle que choisie manuellement.
      </div>

      <div className="space-y-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className="w-full px-3 py-2 rounded-xl border flex items-center justify-between hover:bg-slate-50"
          >
            <span>{t.name}</span>
            <span className="text-xs bg-slate-100 rounded-full px-2 py-0.5">
              {t.refSize} pers. (réf.)
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
