// src/manager/Layout.jsx
import React from 'react'
import AppHeader from '../components/AppHeader.jsx'
import TopTabs from '../components/TopTabs.jsx'

/**
 * Layout base per le pagine Manager.
 * Incorpora Header + Tabs e un contenuto (children).
 */
export default function ManagerLayout({
  tab, setTab,
  children,
}) {
  return (
    <div className="min-h-screen">
      <AppHeader
        title="Naval Planner — Manager"
        subtitle="Pianifica, valida e importa dati"
      />

      <TopTabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'validate', label: 'Validazione' },
          { key: 'import',   label: 'Importa dati' },
        ]}
      />

      <main className="page pb-12">
        <div className="card">
          {children}
        </div>
      </main>
    </div>
  )
}
