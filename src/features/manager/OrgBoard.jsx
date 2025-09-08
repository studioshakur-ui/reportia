import React from "react";

export default function OrgBoard({ workers = [], setWorkers = () => {} }) {
  return (
    <div>
      <div className="mb-2 text-sm opacity-70">Organigramme (stub)</div>
      <ul className="text-sm">
        {workers.map((w) => (
          <li key={w.id}>
            {w.name} — {w.role}
          </li>
        ))}
        {workers.length === 0 && (
          <li className="opacity-60 text-xs">Aucun worker</li>
        )}
      </ul>
      <div className="mt-2">
        <button
          onClick={() =>
            setWorkers([
              ...workers,
              { id: String(Date.now()), name: "Mario", role: "operaio" },
            ])
          }
        >
          + Ajouter (demo)
        </button>
      </div>
    </div>
  );
}
