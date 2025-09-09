// src/components/TopTabs.jsx
import React from 'react'

/**
 * Tabs orizzontali “pill”. Gestione controllata o non controllata.
 * Esempio uso:
 *  <TopTabs
 *    value={tab} onChange={setTab}
 *    items={[{key:'validate',label:'Validazione'},{key:'import',label:'Importa dati'}]}
 *  />
 */
export default function TopTabs({
  items = [],
  value,
  onChange,
  className = '',
}) {
  const [internal, setInternal] = React.useState(items?.[0]?.key)
  const active = value ?? internal

  function select(k) {
    if (onChange) onChange(k)
    else setInternal(k)
  }

  return (
    <div className={`page mt-2 mb-4`}>
      <div className={`flex gap-2`}>
        {items.map((it) => {
          const is = it.key === active
          return (
            <button
              key={it.key}
              onClick={() => select(it.key)}
              className={
                'btn ' +
                (is
                  ? 'btn-primary'
                  : 'btn-ghost')
              }
            >
              {it.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
