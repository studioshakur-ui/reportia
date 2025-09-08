import React from "react";

export default function WorkersAdmin({ workers = [], setWorkers = () => {} }) {
  return (
    <div>
      <div className="mb-2 text-sm opacity-70">Personnel (stub)</div>
      <table className="text-sm">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Rôle</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w) => (
            <tr key={w.id}>
              <td>{w.name}</td>
              <td>{w.role}</td>
              <td>
                <button
                  onClick={() => setWorkers(workers.filter((x) => x.id !== w.id))}
                >
                  Suppr.
                </button>
              </td>
            </tr>
          ))}
          {workers.length === 0 && (
            <tr>
              <td colSpan={3} className="opacity-60 text-xs">
                Aucun personnel
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-2">
        <button
          onClick={() =>
            setWorkers([
              ...workers,
              { id: String(Date.now()), name: "Capo Demo", role: "capo" },
            ])
          }
        >
          + Ajouter Capo (demo)
        </button>
      </div>
    </div>
  );
}
