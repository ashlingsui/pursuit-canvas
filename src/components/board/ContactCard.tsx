import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star } from "lucide-react";
import type { Contact } from "@/data/types";
import { dueTone, formatDue } from "@/lib/dates";
import { useBoard } from "@/lib/board-store";
import { cn } from "@/lib/utils";

function StarButton({ contact }: { contact: Contact }) {
  const { toggleStar } = useBoard();
  return (
    <button
      type="button"
      aria-label={contact.starred ? "Remove star" : "Star contact"}
      aria-pressed={!!contact.starred}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        toggleStar(contact.id);
      }}
      className={cn(
        "shrink-0 rounded-full p-1 transition-colors",
        contact.starred
          ? "text-star"
          : "text-muted-foreground/35 hover:text-star",
      )}
    >
      <Star className="h-[0.95rem] w-[0.95rem]" fill={contact.starred ? "currentColor" : "none"} strokeWidth={1.8} />
    </button>
  );
}

export function ContactCardBody({
  contact,
  accent,
  showCompany = true,
  interactive = true,
}: {
  contact: Contact;
  accent: string;
  showCompany?: boolean;
  interactive?: boolean;
}) {
  const tone = dueTone(contact.nextActionDue);

  return (
    <>
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-[0.85rem]"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-[1rem] font-semibold leading-tight tracking-tight text-foreground">
          {contact.name}
        </h3>
        {interactive ? (
          <StarButton contact={contact} />
        ) : (
          contact.starred && (
            <Star className="mt-[0.1rem] h-[0.95rem] w-[0.95rem] shrink-0 text-star" fill="currentColor" strokeWidth={1.8} />
          )
        )}
      </div>
      <p className="mt-0.5 text-[0.78rem] text-muted-foreground">{contact.affiliation}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {showCompany && (
          <span
            className="rounded-md px-2 py-[0.15rem] text-[0.68rem] font-semibold tracking-tight"
            style={{
              color: `color-mix(in oklab, ${accent} 70%, var(--foreground))`,
              backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
            }}
          >
            {contact.org}
          </span>
        )}
        <span className="rounded-md border border-border/70 px-2 py-[0.15rem] text-[0.68rem] font-medium tracking-tight text-muted-foreground">
          {contact.role}
        </span>
        {contact.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-[0.15rem] text-[0.68rem] font-medium tracking-tight text-muted-foreground/90"
            style={{ backgroundColor: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {contact.nextAction && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl px-2.5 py-2 text-[0.74rem] leading-snug",
            tone === "overdue" && "bg-overdue/10 text-overdue",
            tone === "soon" && "bg-soon/12 text-soon",
            (tone === "later" || tone === null) && "bg-muted text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "mt-[0.3rem] h-1.5 w-1.5 shrink-0 rounded-full",
              tone === "overdue" && "bg-overdue",
              tone === "soon" && "bg-soon",
              (tone === "later" || tone === null) && "bg-muted-foreground/50",
            )}
          />
          <span>
            {contact.nextAction}
            {contact.nextActionDue && (
              <span className="font-semibold"> · {formatDue(contact.nextActionDue)}</span>
            )}
          </span>
        </div>
      )}
    </>
  );
}

const cardClass =
  "animate-settle relative cursor-grab rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 text-left shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]";

export function ContactCardStatic({
  contact,
  accent,
  onOpen,
  showCompany = true,
}: {
  contact: Contact;
  accent: string;
  onOpen: () => void;
  showCompany?: boolean;
}) {
  return (
    <article className={cardClass} onClick={onOpen}>
      <ContactCardBody contact={contact} accent={accent} showCompany={showCompany} interactive={false} />
    </article>
  );
}

export function ContactCard({
  contact,
  accent,
  onOpen,
  showCompany = true,
}: {
  contact: Contact;
  accent: string;
  onOpen: () => void;
  showCompany?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.id,
    data: { stage: contact.stage },
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(cardClass, "active:cursor-grabbing", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      onClick={onOpen}
    >
      <ContactCardBody contact={contact} accent={accent} showCompany={showCompany} />
    </article>
  );
}
