import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';

/**
 * Provider générique pour activer DnD souris + tactile.
 * - sensors: mouse + touch
 * - strategy: rectSortingStrategy (grille/listes)
 */
export default function DndProvider({ items, onChange, renderItem, renderOverlay }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={(e) => {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        // onChange doit gérer soit ré-ordonnancement dans une liste,
        // soit déplacement entre conteneurs (géré dans OrgBoard ci-dessous)
        onChange(e);
      }}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {renderItem?.(activeId)}
      </SortableContext>

      <DragOverlay>
        {activeId && renderOverlay?.(activeId)}
      </DragOverlay>
    </DndContext>
  );
}
