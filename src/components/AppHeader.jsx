// src/components/AppHeader.jsx
import React from 'react'

/**
 * Header applicazione (brand + stato rete + switch tema).
 * Usa le utility definite in src/index.css (btn, chip, app-bar, app-title).
 */
export default function AppHeader({ title = 'Naval Planner', subtitle, rightSlot }) {
  const [online, setOnline] = React.useState(navigator.onLine)
  const [isDark, setIsDark] = React.useState(
    document.documentElement.classList.contains('dark')
  )

  React.useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  function toggleTheme() {
    const next = !isDark
    window.toggleTheme(next)
    setIsDark(next)
  }

  return (
    <header className="w-full">
      <div className="app-bar">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--brand)]/90 shadow-card" />
          <div>
            <div className="app-title">{title}</div>
            {subtitle ? <div className="muted text-sm -mt-0.5">{subtitle}</div> : null}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-2">
          {/* Stato rete */}
          <span
            className="chip select-none"
            title={online ? 'Connessione disponibile' : 'Sei offline'}
          >
            <span
              className={
                'h-2.5 w-2.5 rounded-full ' +
                (online ? 'bg-emerald-400' : 'bg-amber-400')
              }
            />
            {online ? 'Online' : 'Offline'}
          </span>

          {/* Theme */}
          <button
            className="btn-ghost"
            onClick={toggleTheme}
            title="Cambia tema"
          >
            {isDark ? 'Scuro' : 'Chiaro'}
          </button>

          {/* Slot opzionale (es. bottone “Impostazioni”) */}
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
