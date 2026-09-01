import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Contact } from "@/data/types";
import { dueTone, formatDue } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ContactCardBody({ contact, accent }: { contact: Contact; accent: string }) {
  const tone = dueTone(contact.nextActionDue);

  return (
    <>
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-[0.85rem]"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <h3 className="font-display text-[1rem] font-semibold leading-tight tracking-tight text-foreground">
        {contact.name}
      </h3>
      <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
        {contact.org} · {contact.affiliation}
      </p>

      {contact.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {contact.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-[0.15rem] text-[0.68rem] font-medium tracking-tight"
              style={{
                color: `color-mix(in oklab, ${accent} 62%, var(--foreground))`,
                backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

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

export function ContactCard({
  contact,
  accent,
  onOpen,
}: {
  contact: Contact;
  accent: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.id,
    data: { stage: contact.stage },
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "animate-settle relative cursor-grab rounded-[0.85rem] border border-border/70 bg-card p-3.5 pl-4 text-left shadow-[var(--shadow-card)] transition-shadow duration-200",
        "hover:shadow-[var(--shadow-lift)] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
      onClick={onOpen}
    >
      <ContactCardBody contact={contact} accent={accent} />
    </article>
  );
}
