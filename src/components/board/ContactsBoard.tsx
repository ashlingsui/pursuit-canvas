import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CONTACT_STAGES, contactStageMeta, type Contact } from "@/data/types";
import { useBoard } from "@/lib/board-store";
import { useHydrated } from "@/lib/use-hydrated";
import { Column, ColumnShell } from "./Column";
import { ContactCard, ContactCardBody, ContactCardStatic } from "./ContactCard";
import { ContactPanel } from "./ContactPanel";
import { useBoardSensors, resolveDrop } from "./dnd";

const boardClass = "flex gap-5 overflow-x-auto px-6 pb-12 pt-2 lg:px-10";

type Group = { company: string; items: Contact[] };

/** Keeps board order but pulls contacts from the same company next to each other. */
function groupByCompany(items: Contact[]): Group[] {
  const groups: Group[] = [];
  for (const item of items) {
    const existing = groups.find((g) => g.company === item.org);
    if (existing) existing.items.push(item);
    else groups.push({ company: item.org, items: [item] });
  }
  return groups;
}

function CompanyLabel({ company, count, accent }: { company: string; count: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 px-1.5 pt-1">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span className="truncate font-display text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {company}
      </span>
      <span className="text-[0.7rem] font-semibold tabular-nums text-muted-foreground/60">{count}</span>
      <span className="h-px flex-1" style={{ backgroundColor: `color-mix(in oklab, ${accent} 30%, transparent)` }} />
    </div>
  );
}

export function ContactsBoard() {
  const { contacts, query, moveContact } = useBoard();
  const sensors = useBoardSensors();
  const hydrated = useHydrated();
  const [dragging, setDragging] = useState<Contact | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.org.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.affiliation.toLowerCase().includes(q),
      )
    : contacts;

  const columns = CONTACT_STAGES.map((stage, index) => {
    const items = visible.filter((c) => c.stage === stage);
    return {
      stage,
      index,
      meta: contactStageMeta[stage],
      items,
      groups: groupByCompany(items),
    };
  });

  const openContact = contacts.find((c) => c.id === openId) ?? null;

  if (!hydrated) {
    return (
      <div className={boardClass}>
        {columns.map(({ stage, index, meta, items, groups }) => (
          <ColumnShell
            key={stage}
            index={index}
            label={meta.label}
            accent={meta.accent}
            count={items.length}
            empty={q ? "No matches in this stage." : meta.empty}
          >
            {groups.map((group) => (
              <div key={group.company} className="flex flex-col gap-2.5">
                {group.items.length > 1 && (
                  <CompanyLabel company={group.company} count={group.items.length} accent={meta.accent} />
                )}
                {group.items.map((contact) => (
                  <ContactCardStatic
                    key={contact.id}
                    contact={contact}
                    accent={meta.accent}
                    showCompany={group.items.length === 1}
                    onOpen={() => setOpenId(contact.id)}
                  />
                ))}
              </div>
            ))}
          </ColumnShell>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        id="contacts"
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
        <div className={boardClass}>
          {columns.map(({ stage, index, meta, items, groups }) => (
            <Column
              key={stage}
              id={stage}
              index={index}
              label={meta.label}
              accent={meta.accent}
              count={items.length}
              empty={q ? "No matches in this stage." : meta.empty}
            >
              <SortableContext
                items={groups.flatMap((g) => g.items.map((i) => i.id))}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((group) => (
                  <div key={group.company} className="flex flex-col gap-2.5">
                    {group.items.length > 1 && (
                      <CompanyLabel company={group.company} count={group.items.length} accent={meta.accent} />
                    )}
                    {group.items.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        accent={meta.accent}
                        showCompany={group.items.length === 1}
                        onOpen={() => setOpenId(contact.id)}
                      />
                    ))}
                  </div>
                ))}
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {dragging && (
            <div className="relative w-[17.5rem] rotate-[1.2deg] rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 shadow-[var(--shadow-lift)]">
              <ContactCardBody
                contact={dragging}
                accent={contactStageMeta[dragging.stage].accent}
                interactive={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <ContactPanel contact={openContact} onClose={() => setOpenId(null)} />
    </>
  );
}
