import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/** Élément sortable générique */
export default function SortableItem({ id, children, className = '' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'opacity-70' : ''}`}
      {...attributes}
      {...listeners}  // <— gère souris + tactile
    >
      {children}
    </div>
  );
}
