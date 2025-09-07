import React, { useState } from "react";

export default function ImpiantiCatalog({ impianti, setImpianti }) {
  const [name, setName] = useState("");

  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (!impianti.includes(v)) setImpianti((prev) => [...prev, v]);
    setName("");
  };

  const rename = (i, v) => setImpianti((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const remove = (i) => setImpianti((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="card">
      <div className="title">Catalogue — Impianti</div>
      <div className="subtitle">Liste des zones/chantiers disponibles dans l’app.</div>

      <div className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvel impianto (ex: IMPLM)" className="input flex-1" />
        <button onClick={add} className="btn btn-primary">Ajouter</button>
      </div>

      <div className="space-y-3">
        {impianti.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input value={v} onChange={(e) => rename(i, e.target.value)} className="input flex-1" />
            <button onClick={() => remove(i)} className="btn btn-danger">Suppr</button>
          </div>
        ))}
      </div>
    </div>
  );
}
