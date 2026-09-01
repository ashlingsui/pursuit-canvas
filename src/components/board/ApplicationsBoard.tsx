import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, Undo2 } from "lucide-react";
import { APP_STAGES, appStageMeta, type Application } from "@/data/types";
import { useBoard } from "@/lib/board-store";
import { formatShortDate } from "@/lib/dates";
import { Column } from "./Column";
import { ApplicationCard, ApplicationCardBody, ApplicationCardStatic } from "./ApplicationCard";
import { useBoardSensors, resolveDrop } from "./dnd";
import { useHydrated } from "@/lib/use-hydrated";

export function ApplicationsBoard() {
  const { applications, query, moveApplication, setAside, restore } = useBoard();
  const sensors = useBoardSensors();
  const hydrated = useHydrated();
  const [dragging, setDragging] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = (a: Application) =>
    !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);

  const active = applications.filter((a) => !a.setAside);
  const archived = applications.filter((a) => a.setAside);

  return (
    <>
      <DndContext
        id="applications"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) =>
          setDragging(applications.find((a) => a.id === String(e.active.id)) ?? null)
        }
        onDragCancel={() => setDragging(null)}
        onDragEnd={(event) => {
          setDragging(null);
          const drop = resolveDrop(event, active, (a) => a.stage, APP_STAGES);
          if (drop) moveApplication(drop.id, drop.stage, drop.beforeId);
        }}
      >
        <div className="flex gap-5 overflow-x-auto px-6 pb-6 pt-2 lg:px-10">
          {APP_STAGES.map((stage, index) => {
            const meta = appStageMeta[stage];
            const items = active.filter((a) => a.stage === stage && matches(a));
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
                  {items.map((app) =>
                    hydrated ? (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        accent={meta.accent}
                        onSetAside={(reason) => setAside(app.id, reason)}
                      />
                    ) : (
                      <ApplicationCardStatic key={app.id} app={app} accent={meta.accent} />
                    ),
                  )}
                </SortableContext>
              </Column>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {dragging && (
            <div className="relative w-[17.5rem] rotate-[1.2deg] rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 shadow-[var(--shadow-lift)]">
              <ApplicationCardBody app={dragging} accent={appStageMeta[dragging.stage].accent} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <section className="mx-6 mb-10 rounded-2xl border border-border/70 bg-secondary/40 lg:mx-10">
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[0.95rem] font-semibold tracking-tight text-foreground">
              Set aside
            </span>
            <span className="text-[0.78rem] text-muted-foreground">
              {archived.length} closed out — still here if you want them
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${drawerOpen ? "rotate-180" : ""}`}
          />
        </button>

        {drawerOpen && (
          <ul className="space-y-1.5 border-t border-border/70 px-4 py-4">
            {archived.length === 0 && (
              <li className="px-1 font-display text-[0.9rem] italic text-muted-foreground">
                Nothing set aside. Everything is still in play.
              </li>
            )}
            {archived.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-card/70 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.86rem] font-semibold text-foreground/75">
                    {app.company} — {app.role}
                  </p>
                  <p className="text-[0.72rem] text-muted-foreground">
                    {app.setAside === "rejected" ? "Rejected" : "Ghosted"} · applied{" "}
                    {formatShortDate(app.appliedOn)} · {app.resumeVersion}
                  </p>
                </div>
                <button
                  onClick={() => restore(app.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.74rem] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Put back
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
