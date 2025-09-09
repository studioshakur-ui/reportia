import React, { useState } from 'react'

export default function Rapportini() {
  const [filtro, setFiltro] = useState('Da validare')
  const [data, setData] = useState('')

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="btn-ghost h-10 px-3"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option>Da validare</option>
          <option>Validati</option>
          <option>Tutti</option>
        </select>

        <input
          type="date"
          className="btn-ghost h-10 px-3"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <button className="btn">Ricarica</button>
      </div>

      <div className="rounded-xl border p-4 text-muted">
        Nessun rapportino caricato (demo). Integra qui la lista con la tua API.
      </div>
    </section>
  )
}
