import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, MoreHorizontal, Star } from "lucide-react";
import type { Application } from "@/data/types";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Every card renders the same rows — empty ones keep their space so
 *  columns read as an even stack instead of a ragged one. */
const cardShell =
  "animate-settle relative flex h-[11.5rem] flex-col rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 pr-9";

export function ApplicationCardBody({ app, accent }: { app: Application; accent: string }) {
  return (
    <>
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-[0.85rem]"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <h3 className="line-clamp-1 font-display text-[1rem] font-semibold leading-tight tracking-tight text-foreground">
        {app.company}
      </h3>
      <p className="mt-0.5 line-clamp-2 min-h-[2.1rem] text-[0.78rem] leading-[1.05rem] text-muted-foreground">
        {app.role}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-md px-1.5 py-[0.15rem] font-mono text-[0.66rem] font-medium"
          style={{
            color: `color-mix(in oklab, ${accent} 62%, var(--foreground))`,
            backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
          }}
        >
          {app.resumeVersion}
        </span>
        <span className="text-[0.7rem] text-muted-foreground/80">
          applied {formatShortDate(app.appliedOn)}
        </span>
      </div>
      <p className="mt-2 min-h-[1.05rem] truncate text-[0.74rem] text-muted-foreground">
        {app.referredBy && (
          <>
            Referred by <span className="font-semibold text-foreground/80">{app.referredBy}</span>
          </>
        )}
      </p>
      <p className="mt-0.5 min-h-[1rem] truncate text-[0.72rem] text-muted-foreground/80">
        {[app.seniority, app.location].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-auto min-h-[1.15rem] pt-1.5">
        {app.postingUrl && (
          <a
            href={app.postingUrl}
            target="_blank"
            rel="noreferrer noopener"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> View posting
          </a>
        )}
      </div>
    </>
  );
}

export function ApplicationCardStatic({ app, accent }: { app: Application; accent: string }) {
  return (
    <article className={cn(cardShell, "shadow-[var(--shadow-card)]")}>
      <ApplicationCardBody app={app} accent={accent} />
      {app.starred && (
        <Star
          className="absolute right-2.5 top-2.5 h-4 w-4"
          style={{ color: "var(--star)", fill: "var(--star)" }}
        />
      )}
    </article>
  );
}

export function ApplicationCard({
  app,
  accent,
  onSetAside,
  onToggleStar,
}: {
  app: Application;
  accent: string;
  onSetAside: (reason: "rejected" | "ghosted") => void;
  onToggleStar: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { stage: app.stage },
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        cardShell,
        "group shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]",
        isDragging && "opacity-40",
      )}
    >
      <div
        className="flex flex-1 cursor-grab flex-col active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <ApplicationCardBody app={app} accent={accent} />
      </div>

      <button
        onClick={onToggleStar}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={app.starred ? "Unstar this application" : "Star this application"}
        aria-pressed={app.starred ?? false}
        className={cn(
          "absolute right-1.5 top-2 rounded-full p-1.5 transition",
          app.starred
            ? "opacity-100"
            : "text-muted-foreground/50 opacity-0 hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100",
        )}
        style={app.starred ? { color: "var(--star)" } : undefined}
      >
        <Star className="h-4 w-4" style={app.starred ? { fill: "var(--star)" } : undefined} />
      </button>

      <button
        onClick={() => setMenuOpen((v) => !v)}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Set this application aside"
        className="absolute right-1.5 top-9 rounded-full p-1.5 text-muted-foreground/60 opacity-0 transition hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="animate-settle absolute right-2 top-16 z-20 w-[11.5rem] overflow-hidden rounded-xl border border-border/70 bg-card py-1 shadow-[var(--shadow-lift)]">
            <p className="px-3 pb-1 pt-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Set aside as
            </p>
            {(["rejected", "ghosted"] as const).map((reason) => (
              <button
                key={reason}
                onClick={() => {
                  setMenuOpen(false);
                  onSetAside(reason);
                }}
                className="block w-full px-3 py-1.5 text-left text-[0.8rem] text-foreground/85 transition-colors hover:bg-muted"
              >
                {reason === "rejected" ? "Rejected" : "Ghosted"}
              </button>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
