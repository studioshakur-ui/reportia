import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ManagerLayout from './manager/Layout.jsx'
import Rapportini from './manager/Rapportini.jsx'
import ImportOperai from './manager/ImportOperai.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/manager/rapportini" replace />} />

        <Route element={<ManagerLayout />}>
          <Route path="/manager/rapportini" element={<Rapportini />} />
          <Route path="/manager/import" element={<ImportOperai />} />
        </Route>

        {/* 404 simple */}
        <Route path="*" element={
          <div className="mx-auto max-w-3xl p-6">
            <h2 className="text-2xl font-bold mb-2">Pagina non trovata</h2>
            <p className="text-muted">Il percorso richiesto non esiste.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
