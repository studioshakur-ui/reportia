import { useState, useMemo } from 'react';
import DndProvider from '../dnd/DndProvider.jsx';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Grip() { return <span className="ml-auto cursor-grab text-zinc-400 select-none">⋮⋮</span>; }

function SortableRow({ id, riga, onChange, onAttach }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none',
    WebkitUserSelect: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border p-3 bg-white/80 dark:bg-zinc-900/50 flex items-center gap-2">
      <div className="text-sm w-28">
        <select value={riga.worker_id || ''} onChange={(e)=>onChange({ ...riga, worker_id: e.target.value })}
          className="w-full rounded-md border px-2 py-1">
          <option value="">Operatore</option>
          {riga.operaiDisponibili.map(o => (<option key={o.id} value={o.id}>{o.full_name}</option>))}
        </select>
      </div>
      <div className="w-20">
        <input type="number" value={riga.ore} onChange={(e)=>onChange({ ...riga, ore: Number(e.target.value||0) })}
          className="w-full rounded-md border px-2 py-1 text-center"/>
      </div>
      <div className="flex-1">
        <input value={riga.descrizione} onChange={(e)=>onChange({ ...riga, descrizione: e.target.value })}
          placeholder="Descrizione attività" className="w-full rounded-md border px-2 py-1"/>
      </div>
      <div className="w-28 flex items-center gap-1">
        <input type="number" value={riga.prodotto_qty} onChange={(e)=>onChange({ ...riga, prodotto_qty: Number(e.target.value||0) })}
          className="w-16 rounded-md border px-2 py-1 text-right"/>
        <span className="text-xs opacity-70">{riga.prodotto_unit}</span>
      </div>
      <div className="w-28">
        <input type="number" value={riga.previsto} onChange={(e)=>onChange({ ...riga, previsto: Number(e.target.value||0) })}
          className="w-full rounded-md border px-2 py-1 text-right"/>
      </div>
      <div className="flex-1">
        <input value={riga.note || ''} onChange={(e)=>onChange({ ...riga, note: e.target.value })}
          placeholder="Note" className="w-full rounded-md border px-2 py-1"/>
      </div>
      <label className="px-2 py-1 rounded-md border cursor-pointer">
        📎
        <input type="file" className="hidden" onChange={(e)=>onAttach(e.target.files?.[0])}/>
      </label>
      <div {...attributes} {...listeners}><Grip/></div>
    </div>
  );
}

export default function DraggableLines({ initial, operai, onChangeOrder, onAttachAt }) {
  const [righe, setRighe] = useState(initial);
  const ids = useMemo(()=> righe.map((_,i)=>`riga-${i}`), [righe]);

  const setOne = (idx, val) => {
    const next = righe.map((r,i)=> i===idx ? val : r);
    setRighe(next);
    onChangeOrder?.(next);
  };

  function onDragEnd(evt) {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const next = arrayMove(righe, oldIndex, newIndex);
    setRighe(next);
    onChangeOrder?.(next);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {righe.map((r, i) => (
            <SortableRow
              key={ids[i]}
              id={ids[i]}
              riga={{...r, operaiDisponibili: operai}}
              onChange={(val)=>setOne(i, val)}
              onAttach={(file)=>onAttachAt?.(i, file)}
            />
          ))}
        </div>
      </SortableContext>
    </DndProvider>
  );
}
