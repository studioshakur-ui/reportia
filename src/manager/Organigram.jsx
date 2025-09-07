import React from "react";
import { useAppStore } from "../store/app.js";

export default function ManagerOrg() {
  const { capi } = useAppStore();
  return (
    <div className="card mt-6">
      <div className="text-lg font-semibold mb-2">Organigramme (version simple)</div>
      <div className="subtitle">Prochaine étape : drag & drop des équipes et affectations.</div>
      <ul className="list-disc pl-6 text-sm text-slate-700">
        {capi.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </div>
  );
}
