import React from 'react'
import AppHeader from '../components/AppHeader.jsx'
import TopTabs from '../components/TopTabs.jsx'
export default function CapoLayout({ tab, setTab, children }) {
  return (
    <div className="min-h-screen">
      <AppHeader title="Naval Planner — Capo Squadra" subtitle="Rapporti rapidi, attività, allegati" />
      <TopTabs value={tab} onChange={setTab} items={[
        { key:'nuovo', label:'Nuovo rapportino' },
        { key:'storico', label:'Storico (locale)' }
      ]}/>
      <main className="page pb-12"><div className="card">{children}</div></main>
    </div>
  )
}
