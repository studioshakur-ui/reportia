import React, { useMemo, useState } from "react";
import PlannerForm from "../components/PlannerForm.jsx";
import TaskShortcuts from "../components/TaskShortcuts.jsx";
import ReportPreview from "../components/ReportPreview.jsx";
import { formatISODateKey, weekdaysFor } from "../utils/storage.js";

export default function Manager({ tasks, impianti, capi, managerData, setManagerData }) {
  const [selected] = useState(new Date()); // point de référence pour la semaine
  const days = useMemo(() => weekdaysFor(selected), [selected]);

  const [activeKey, setActiveKey] = useState(formatISODateKey(new Date()));
  const current = managerData[activeKey] || {
    taskId: "",
    impianto: "",
    capoName: "",
    includeCapo: true,
    team: [], // [{id,name,hours,activity,qty}]
  };

  const saveCurrent = (patch) =>
    setManagerData((prev) => ({ ...prev, [activeKey]: { ...current, ...patch } }));

  return (
    <div className="mt-6">
      <div className="flex gap-2 flex-wrap">
        {days.map((d) => {
          const isActive = d.key === activeKey;
          return (
            <button
              key={d.key}
              onClick={() => setActiveKey(d.key)}
              className={`px-4 py-2 rounded-xl font-semibold ${
                isActive ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-700 border"
              }`}
            >
              <div>{d.labelShort}</div>
              <div className="text-xs opacity-80">{d.ddmmyyyy}</div>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
        <div className="card">
          <PlannerForm
            tasks={tasks}
            impianti={impianti}
            capi={capi}
            value={current}
            onChange={saveCurrent}
          />
        </div>
        <div className="card h-fit">
          <TaskShortcuts tasks={tasks} onPick={(t) => saveCurrent({ taskId: t.id })} />
        </div>
      </div>

      <div className="card mt-6">
        <ReportPreview
          dateKey={activeKey}
          tasks={tasks}
          value={current}
          onSaveLocal={() => setManagerData((p) => ({ ...p }))}
          onCopy={(txt) => navigator.clipboard.writeText(txt)}
          onSend={() => alert("Envoi WhatsApp/Email → à intégrer")}
        />
      </div>
    </div>
  );
}
