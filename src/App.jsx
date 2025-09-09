import React from 'react'
import Capo from './capo/Capo.jsx'
import ManagerLayout from './manager/Layout.jsx'

export default function App(){
  const [mode, setMode] = React.useState('capo') // 'manager' | 'capo'

  return (
    <div className="min-h-screen">
      <div className="page py-4 flex gap-2">
        <button className={'btn ' + (mode==='capo'?'btn-primary':'btn-ghost')} onClick={()=>setMode('capo')}>Capo</button>
        <button className={'btn ' + (mode==='manager'?'btn-primary':'btn-ghost')} onClick={()=>setMode('manager')}>Manager</button>
        <button className="btn-ghost ml-auto" onClick={()=>window.toggleTheme()}>Tema</button>
      </div>
      {mode==='capo' ? (
        <Capo/>
      ) : (
        <ManagerLayout>
          <h2>Area Manager</h2>
          <p className="muted">Qui andranno Import, Validazione, Team Planner…</p>
        </ManagerLayout>
      )}
    </div>
  )
}
