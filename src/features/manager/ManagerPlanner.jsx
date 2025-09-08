import React from "react";

export default function ManagerPlanner({
  plan = {},
  setDay = () => {},
  tasks = [],
  impianti = [],
  activities = [],
  workers = [],
  todayKey = "",
}) {
  return (
    <div>
      <div className="mb-2 text-sm opacity-70">Planning (stub)</div>
      <div className="text-xs opacity-60">
        Aujourd’hui: {todayKey || "(inconnu)"} — Jours dans le plan: {Object.keys(plan).length}
      </div>
      <div className="mt-2">
        <button onClick={() => setDay(todayKey, { demo: true })}>
          Définir le jour d’aujourd’hui (demo)
        </button>
      </div>
    </div>
  );
}
