import React, { useRef, useState } from 'react'

export default function ImportOperai() {
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [invalid, setInvalid] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoMatricola, setAutoMatricola] = useState(true)
  const [sheetName, setSheetName] = useState('')

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setRows([]); setInvalid([]); setHeaders([]); setSheetName('')

    try {
      // Import paresseux pour réduire le bundle initial
      const XLSX = await import('xlsx')

      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const firstSheet = wb.SheetNames[0]
      const sheet = wb.Sheets[firstSheet]
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })

      const [head = [], ...body] = json
      setHeaders(head)
      setSheetName(firstSheet)

      // Normalisation très permissive : on filtre les lignes vides
      const clean = body
        .map(r => (Array.isArray(r) ? r : []))
        .filter(r => r.some(cell => String(cell ?? '').trim() !== ''))

      // Exemple de validation minimale: exige au moins 2 colonnes (nom + matricola)
      const out = []
      const bad = []
      for (const r of clean) {
        const [nome, matricola, ...resto] = r
        if ((!nome || !String(nome).trim()) && (!matricola || !String(matricola).trim())) {
          bad.push({ r, reason: 'nome o matricola mancanti' })
          continue
        }
        out.push({ nome: String(nome ?? '').trim(), matricola: String(matricola ?? '').trim(), resto })
      }

      // Auto-génération matricola si demandé
      if (autoMatricola) {
        let seq = 1
        for (const r of out) {
          if (!r.matricola) r.matricola = `TMP-${String(seq++).padStart(4, '0')}`
        }
      }

      setRows(out)
      setInvalid(bad)
    } catch (err) {
      console.error(err)
      setInvalid([{ r: [], reason: err.message || 'Errore lettura file' }])
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function onImportToDb() {
    // branche ici l’appel à ton service (Supabase, etc.)
    alert(`Da importare: ${rows.length} righe (demo)`)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="tabs">
          <button className="tab active">Importa dati</button>
        </div>

        <label className="inline-flex items-center gap-2 ml-auto text-sm cursor-pointer select-none">
          <input type="checkbox" className="accent-current"
                 checked={autoMatricola}
                 onChange={e => setAutoMatricola(e.target.checked)} />
          <span className="text-muted">Genera automaticamente la matricola quando manca</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          className="btn-ghost"
          href="data:text/csv;charset=utf-8,Nome,Matricola"
          download="template_operai.csv"
        >
          Scarica template CSV
        </a>

        <label className="btn-ghost cursor-pointer">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onPickFile}
          />
          Seleziona file (.xlsx, .csv)
        </label>

        <button className="btn" onClick={onImportToDb} disabled={!rows.length || loading}>
          Importa su database
        </button>
      </div>

      <div className="rounded-xl border p-4 bg-soft">
        {loading && <p className="text-muted">Lettura file…</p>}

        {!loading && !rows.length && !invalid.length && (
          <div className="text-center text-muted py-16">
            <div className="mx-auto mb-3 h-10 w-10 rounded-2xl grid place-items-center bg-white/70 dark:bg-[#1b2244]/70">
              📄
            </div>
            <p>Seleziona un file Excel/CSV per importare gli operai.</p>
          </div>
        )}

        {!!headers.length && (
          <p className="text-xs text-muted mb-3">
            Colonne rilevate: <span className="font-medium">{headers.join(' · ') || '(vuoto)'}</span> —{' '}
            <span className="opacity-80">Foglio: {sheetName || '(?)'}</span>
          </p>
        )}

        {!!invalid.length && (
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 px-2 py-0.5 text-xs font-semibold">
              Righe scartate: {invalid.length}
            </span>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted max-h-48 overflow-auto">
              {invalid.slice(0, 50).map((x, i) => (
                <li key={i}>Motivo: {x.reason}</li>
              ))}
              {invalid.length > 50 && <li>…</li>}
            </ul>
          </div>
        )}

        {!!rows.length && (
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-white/60 dark:bg-[#1b2244]/40">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Nome</th>
                  <th className="text-left px-3 py-2">Matricola</th>
                  <th className="text-left px-3 py-2">…</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="odd:bg-white/40 dark:odd:bg-[#101737]">
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2">{r.nome || <em className="text-muted">—</em>}</td>
                    <td className="px-3 py-2">{r.matricola || <em className="text-muted">—</em>}</td>
                    <td className="px-3 py-2 text-muted">({r.resto?.length ?? 0} colonne extra)</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="p-2 text-xs text-muted">Mostrate 100 righe su {rows.length}…</div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
