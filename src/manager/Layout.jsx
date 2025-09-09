import React from "react"

export default function Layout({ tab, setTab, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="shadow-md bg-white dark:bg-gray-800">
        <nav className="flex items-center justify-between px-6 py-3">
          {/* Logo / Titre */}
          <h1 className="text-2xl font-bold text-brand dark:text-brand-2">
            Reportia
          </h1>

          {/* Boutons */}
          <div className="flex items-center gap-3">
            {/* Switch thème */}
            <button
              onClick={() => window.toggleTheme()}
              className="px-3 py-1 rounded-xl bg-brand text-white hover:bg-brand/80 transition"
            >
              Switch Theme
            </button>

            {/* Tabs Manager */}
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         px-2 py-1"
            >
              <option value="validazione">Validazione</option>
              <option value="import">Importa Dati</option>
            </select>
          </div>
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 p-6">{children}</main>

      {/* Footer */}
      <footer className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Reportia – Naval Planner
      </footer>
    </div>
  )
}
