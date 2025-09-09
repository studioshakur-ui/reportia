import React from 'react'
import CapoLayout from './Layout.jsx'
const LS_KEY='capo-rapportini-locali'
const load=()=>{ try{const r=localStorage.getItem(LS_KEY); return r?JSON.parse(r):[]}catch{return[]} }
const save=(x)=>localStorage.setItem(LS_KEY, JSON.stringify(x))
export default function Capo(){
  const [tab,setTab]=React.useState('nuovo')
  const [date,setDate]=React.useState(()=>new Date().toISOString().slice(0,10))
  const [ore,setOre]=React.useState('')
  const [note,setNote]=React.useState('')
  const [files,setFiles]=React.useState([])
  const [storico,setStorico]=React.useState(load())
  const [saving,setSaving]=React.useState(false)
  const [err,setErr]=React.useState(''); const [ok,setOk]=React.useState(false)
  function onPick(e){ setFiles(Array.from(e.target.files||[])) }
  function clearLocal(){ if(!confirm('Svuotare lo storico locale?'))return; save([]); setStorico([]) }
  async function saveOffline(e){
    e.preventDefault(); setErr(''); setOk(false)
    if(!date) return setErr('Seleziona la data.')
    if(!ore || Number(ore)<=0) return setErr('Indica le ore totali (> 0).')
    setSaving(true)
    try{
      const allegati = files.map(f=>({name:f.name,size:f.size,type:f.type}))
      const item={ id:crypto.randomUUID(), date, oreTotali:Number(ore), note:note?.trim()||'', allegati, createdAt:Date.now(), status:'bozza' }
      const next=[item, ...storico]; setStorico(next); save(next)
      setOk(true); setFiles([]); setNote(''); setOre('')
    }catch(e){ setErr(e?.message||'Errore salvataggio locale') } finally{ setSaving(false) }
  }
  return (
    <CapoLayout tab={tab} setTab={setTab}>
      {tab==='nuovo' && (
        <form onSubmit={saveOffline} className="space-y-6">
          <h2>Nuovo rapportino</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="field"><span>Data</span>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <label className="field"><span>Ore totali</span>
              <input type="number" min="0" step="0.5" placeholder="0" value={ore} onChange={e=>setOre(e.target.value)} />
            </label>
          </div>
          <label className="field"><span>Note (opzionale)</span>
            <textarea rows={3} placeholder="Aggiungi dettagli, area di lavoro, ecc." value={note} onChange={e=>setNote(e.target.value)} />
          </label>
          <div className="space-y-2">
            <div className="muted">Allegati (foto, PDF, Excel)</div>
            <label className="btn-ghost inline-flex cursor-pointer">
              <input type="file" className="hidden" multiple onChange={onPick} accept="image/*,.pdf,.xlsx,.xls,.csv" />
              Seleziona file…
            </label>
            {files.length>0 && <ul className="text-sm muted mt-1 list-disc pl-4">
              {files.map(f=><li key={f.name}>{f.name} — {(f.size/1024).toFixed(1)} KB</li>)}
            </ul>}
          </div>
          {err && <div className="text-red-400 text-sm">{err}</div>}
          {ok && <div className="text-emerald-400 text-sm">Salvato offline ✅</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={saving}>{saving?'Salvataggio…':'Salva (offline)'}</button>
            <button type="button" className="btn-ghost" onClick={()=>{
              setDate(new Date().toISOString().slice(0,10)); setOre(''); setNote(''); setFiles([]); setOk(false); setErr('')
            }}>Reimposta</button>
          </div>
        </form>
      )}
      {tab==='storico' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2>Storico locale</h2>
            {storico.length>0 && <button className="btn-ghost" onClick={clearLocal}>Svuota</button>}
          </div>
          {storico.length===0 ? <div className="muted">Nessun rapportino salvato in locale.</div> : (
            <div className="space-y-3">
              {storico.map(r=>(
                <div key={r.id} className="row items-start">
                  <div className="col-span-12">
                    <div className="font-semibold">{new Date(r.createdAt).toLocaleString()} • {r.date}</div>
                    <div className="muted text-sm">Ore: {r.oreTotali} · Stato: {r.status}</div>
                    {r.note && <div className="text-sm mt-1">{r.note}</div>}
                    {r.allegati?.length>0 && <div className="muted text-xs mt-1">Allegati: {r.allegati.map(a=>a.name).join(', ')}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </CapoLayout>
  )
}
