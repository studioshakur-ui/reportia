 refactor/canonical

// src/main.jsx
 main
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

 refactor/canonical
;(function bootstrapTheme(){
  try {
    const saved = localStorage.getItem('theme')

// ——— Gestione tema (dark di default, salvataggio in localStorage) ———
(function bootstrapTheme() {
  try {
    const saved = localStorage.getItem('theme') // 'dark' | 'light' | null
main
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = saved ? saved === 'dark' : systemDark
    document.documentElement.classList.toggle('dark', shouldDark)
    document.documentElement.setAttribute('data-theme', shouldDark ? 'dark' : 'light')
 refactor/canonical
  } catch { document.documentElement.classList.add('dark') }
})()
window.toggleTheme = (next)=>{
  const isDark = typeof next==='boolean' ? next : !document.documentElement.classList.contains('dark')
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App/></React.StrictMode>

  } catch (_) {
    // fallback: dark
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()

// Facile da usare nei tuoi componenti: window.toggleTheme()
window.toggleTheme = function toggleTheme(next) {
  const isDark = typeof next === 'boolean'
    ? next
    : !document.documentElement.classList.contains('dark')
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
main
)
