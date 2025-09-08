import React from "react";

export default function CatalogueManager({
  tasks = [],
  setTasks = () => {},
  impianti = [],
  setImpianti = () => {},
  activities = [],
  setActivities = () => {},
}) {
  return (
    <div>
      <div className="mb-2 text-sm opacity-70">Catalogue (stub)</div>
      <div className="text-xs opacity-70">
        Tasks: {tasks.length} • Impianti: {impianti.length} • Activities: {activities.length}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() =>
            setTasks([...tasks, { id: "task-" + Date.now(), label: "Nouvelle tâche" }])
          }
        >
          + Task (demo)
        </button>
        <button
          onClick={() =>
            setImpianti([...impianti, { id: "imp-" + Date.now(), label: "Nouveau impianto" }])
          }
        >
          + Impianto (demo)
        </button>
        <button
          onClick={() =>
            setActivities([...activities, { id: "act-" + Date.now(), label: "Nouvelle activité" }])
          }
        >
          + Activité (demo)
        </button>
      </div>
    </div>
  );
}
