import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal } from "lucide-react";
import type { Application } from "@/data/types";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ApplicationCardBody({ app, accent }: { app: Application; accent: string }) {
  return (
    <>
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-[0.85rem]"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <h3 className="font-display text-[1rem] font-semibold leading-tight tracking-tight text-foreground">
        {app.company}
      </h3>
      <p className="mt-0.5 text-[0.78rem] text-muted-foreground">{app.role}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
      {app.referredBy && (
        <p className="mt-2 text-[0.74rem] text-muted-foreground">
          Referred by <span className="font-semibold text-foreground/80">{app.referredBy}</span>
        </p>
      )}
    </>
  );
}

export function ApplicationCard({
  app,
  accent,
  onSetAside,
}: {
  app: Application;
  accent: string;
  onSetAside: (reason: "rejected" | "ghosted") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { stage: app.stage },
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "animate-settle group relative rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]",
        isDragging && "opacity-40",
      )}
    >
      <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <ApplicationCardBody app={app} accent={accent} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground/60 opacity-0 transition hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onSetAside("rejected")}>
            Set aside — rejected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSetAside("ghosted")}>
            Set aside — ghosted
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
