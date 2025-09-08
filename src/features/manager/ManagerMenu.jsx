import React from "react";

export default function ManagerMenu({
  workers = [],
  setWorkers = () => {},
  tasks = [],
  setTasks = () => {},
  impianti = [],
  setImpianti = () => {},
  activities = [],
  setActivities = () => {},
  user = { role: "manager", name: "Manager" },
  setUser = () => {},
}) {
  return (
    <div>
      <div className="mb-2 text-sm opacity-70">Menu Manager (stub)</div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setUser({ ...user, role: "manager" })}>
          Rôle : Manager
        </button>
        <button onClick={() => setUser({ ...user, role: "capo" })}>
          Rôle : Capo
        </button>
      </div>

      <div className="text-xs opacity-70">
        Workers: {workers.length} • Tasks: {tasks.length} • Impianti: {impianti.length} • Activities: {activities.length}
      </div>
    </div>
  );
}
