import type { DragEndEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

export function useBoardSensors() {
  return useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
}

/**
 * Resolves a drag end event into a target column + the id of the item the
 * dragged card should be inserted before (null = append to the end).
 */
export function resolveDrop<T extends { id: string }, S extends string>(
  event: DragEndEvent,
  items: T[],
  stageOf: (item: T) => S,
  stages: readonly S[],
): { id: string; stage: S; beforeId: string | null } | null {
  const { active, over } = event;
  if (!over) return null;
  const activeId = String(active.id);
  const overId = String(over.id);
  if (activeId === overId) return null;

  const activeItem = items.find((i) => i.id === activeId);
  if (!activeItem) return null;

  if ((stages as readonly string[]).includes(overId)) {
    return { id: activeId, stage: overId as S, beforeId: null };
  }

  const overItem = items.find((i) => i.id === overId);
  if (!overItem) return null;
  const stage = stageOf(overItem);
  const inColumn = items.filter((i) => stageOf(i) === stage);
  const activeIndex = inColumn.findIndex((i) => i.id === activeId);
  const overIndex = inColumn.findIndex((i) => i.id === overId);

  // Dragging downwards inside the same column: land after the hovered card.
  if (activeIndex !== -1 && activeIndex < overIndex) {
    const next = inColumn[overIndex + 1];
    return { id: activeId, stage, beforeId: next ? next.id : null };
  }

  return { id: activeId, stage, beforeId: overId };
}
