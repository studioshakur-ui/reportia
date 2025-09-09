// src/manager/ImportOperai.jsx
import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'

export default function ImportOperai() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)

      // 👉 on prend la première feuille par défaut
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (parsed.length === 0) {
        setError("⚠️ Le fichier est vide ou mal formaté.")
        return
      }

      setRows(parsed)
    } catch (err) {
      console.error(err)
      setError("Erreur lors de la lecture du fichier")
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const uploadData = async () => {
    if (rows.length === 0) {
      setError("⚠️ Aucun opérario à importer")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 👉 insérer dans la table "operai"
      const { data, error } = await supabase
        .from('operai')
        .insert(rows)

      if (error) throw error
      console.log("✅ Import terminé :", data)
      setRows([])
    } catch (err) {
      console.error(err)
      setError("Erreur lors de l'import dans Supabase")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Importa dati operai</h2>

      <input
        type="file"
        accept=".xlsx,.csv"
        ref={fileRef}
        onChange={handleFile}
      />

      <button onClick={uploadData} disabled={loading}>
        {loading ? "Import en cours..." : "Importer dans la base"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {rows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Prévisualisation ({rows.length} lignes)</h3>
          <pre>{JSON.stringify(rows.slice(0, 5), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
