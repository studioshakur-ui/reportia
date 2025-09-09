import React from 'react'
export default function AppHeader({ title='Naval Planner', subtitle, rightSlot }) {
  const [online,setOnline]=React.useState(navigator.onLine)
  const [isDark,setIsDark]=React.useState(document.documentElement.classList.contains('dark'))
  React.useEffect(()=>{
    const on=()=>setOnline(true), off=()=>setOnline(false)
    window.addEventListener('online',on); window.addEventListener('offline',off)
    return ()=>{ window.removeEventListener('online',on); window.removeEventListener('offline',off) }
  },[])
  function toggleTheme(){ const next=!isDark; window.toggleTheme(next); setIsDark(next) }
  return (
    <header className="w-full">
      <div className="app-bar">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--brand)]/90 shadow-card" />
          <div>
            <div className="app-title">{title}</div>
            {subtitle ? <div className="muted text-sm -mt-0.5">{subtitle}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip select-none">
            <span className={'h-2.5 w-2.5 rounded-full '+(online?'bg-emerald-400':'bg-amber-400')}/>
            {online?'Online':'Offline'}
          </span>
          <button className="btn-ghost" onClick={toggleTheme}>{isDark?'Scuro':'Chiaro'}</button>
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
