import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

;(function bootstrapTheme(){
  try {
    const saved = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = saved ? saved === 'dark' : systemDark
    document.documentElement.classList.toggle('dark', shouldDark)
    document.documentElement.setAttribute('data-theme', shouldDark ? 'dark' : 'light')
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
)
