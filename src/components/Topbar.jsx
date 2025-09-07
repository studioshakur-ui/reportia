import React from "react";

export default function Topbar({ onImportExcel, onSettings }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-indigo-600" />
        <div>
          <div className="text-xl font-bold">Naval Planner</div>
          <div className="text-slate-500 text-sm">Catalogue dynamique • Capo avec pièces jointes</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onImportExcel} className="btn btn-outline">Importer Excel (.xlsx)</button>
        <button onClick={onSettings} className="btn btn-outline">Paramètres</button>
      </div>
    </div>
  );
}
