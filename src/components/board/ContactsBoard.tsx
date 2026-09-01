import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CONTACT_STAGES, contactStageMeta, type Contact } from "@/data/types";
import { useBoard } from "@/lib/board-store";
import { Column } from "./Column";
import { ContactCard, ContactCardBody } from "./ContactCard";
import { ContactPanel } from "./ContactPanel";
import { useBoardSensors, resolveDrop } from "./dnd";

export function ContactsBoard() {
  const { contacts, query, moveContact } = useBoard();
  const sensors = useBoardSensors();
  const [dragging, setDragging] = useState<Contact | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.org.toLowerCase().includes(q) ||
          c.affiliation.toLowerCase().includes(q),
      )
    : contacts;

  const openContact = contacts.find((c) => c.id === openId) ?? null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) =>
          setDragging(contacts.find((c) => c.id === String(e.active.id)) ?? null)
        }
        onDragCancel={() => setDragging(null)}
        onDragEnd={(event) => {
          setDragging(null);
          const drop = resolveDrop(event, contacts, (c) => c.stage, CONTACT_STAGES);
          if (drop) moveContact(drop.id, drop.stage, drop.beforeId);
        }}
      >
        <div className="flex gap-5 overflow-x-auto px-6 pb-12 pt-2 lg:px-10">
          {CONTACT_STAGES.map((stage, index) => {
            const meta = contactStageMeta[stage];
            const items = visible.filter((c) => c.stage === stage);
            return (
              <Column
                key={stage}
                id={stage}
                index={index}
                label={meta.label}
                accent={meta.accent}
                count={items.length}
                empty={q ? "No matches in this stage." : meta.empty}
              >
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {items.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      accent={meta.accent}
                      onOpen={() => setOpenId(contact.id)}
                    />
                  ))}
                </SortableContext>
              </Column>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {dragging && (
            <div className="relative w-[17.5rem] rotate-[1.2deg] rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 shadow-[var(--shadow-lift)]">
              <ContactCardBody contact={dragging} accent={contactStageMeta[dragging.stage].accent} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <ContactPanel contact={openContact} onClose={() => setOpenId(null)} />
    </>
  );
}
