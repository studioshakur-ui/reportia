import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';

export default function DndProvider({ children, onDragEnd, modifiers = [restrictToParentElement] }) {
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } })
  );
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={modifiers} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}
