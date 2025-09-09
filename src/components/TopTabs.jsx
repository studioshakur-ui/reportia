import React from 'react'
export default function TopTabs({ items=[], value, onChange }) {
  const [internal,setInternal]=React.useState(items?.[0]?.key)
  const active=value ?? internal
  function select(k){ onChange ? onChange(k) : setInternal(k) }
  return (
    <div className="page mt-2 mb-4">
      <div className="flex gap-2">
        {items.map(it=>{
          const is = it.key===active
          return <button key={it.key} onClick={()=>select(it.key)} className={'btn ' + (is?'btn-primary':'btn-ghost')}>{it.label}</button>
        })}
      </div>
    </div>
  )
}
