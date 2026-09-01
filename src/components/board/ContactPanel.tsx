import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { CONTACT_STAGES, contactStageMeta, type Contact } from "@/data/types";
import { NoteSummary } from "./NoteSummary";
import { useBoard } from "@/lib/board-store";
import { formatDate } from "@/lib/dates";

const fieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[0.88rem] text-foreground outline-none transition-colors hover:border-border focus:border-ring focus:bg-card";

const labelClass = "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80";

export function ContactPanel({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const { updateContact, addNote, toggleStar } = useBoard();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft("");
  }, [contact?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!contact) return null;
  const accent = contactStageMeta[contact.stage].accent;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
      />
      <aside className="animate-panel-in relative flex h-full w-full max-w-[34rem] flex-col bg-card shadow-[var(--shadow-panel)]">
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: accent }} />

        <div className="flex items-start justify-between gap-4 px-8 pt-7">
          <div className="min-w-0 flex-1">
            <input
              value={contact.name}
              onChange={(e) => updateContact(contact.id, { name: e.target.value })}
              className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground outline-none transition-colors hover:border-border focus:border-ring"
            />
            <div className="mt-1 flex flex-wrap items-center gap-1 px-2">
              <input
                value={contact.org}
                onChange={(e) => updateContact(contact.id, { org: e.target.value })}
                size={Math.max(contact.org.length, 4)}
                className="rounded-md border border-transparent bg-transparent text-[0.85rem] text-muted-foreground outline-none hover:border-border focus:border-ring"
              />
              <span className="text-muted-foreground">·</span>
              <input
                value={contact.role}
                onChange={(e) => updateContact(contact.id, { role: e.target.value })}
                size={Math.max(contact.role.length, 4)}
                className="rounded-md border border-transparent bg-transparent text-[0.85rem] text-muted-foreground outline-none hover:border-border focus:border-ring"
              />
              <span className="text-muted-foreground">·</span>
              <input
                value={contact.affiliation}
                onChange={(e) => updateContact(contact.id, { affiliation: e.target.value })}
                size={Math.max(contact.affiliation.length, 4)}
                className="rounded-md border border-transparent bg-transparent text-[0.85rem] text-muted-foreground outline-none hover:border-border focus:border-ring"
              />
            </div>
          </div>
          <button
            aria-label={contact.starred ? "Remove star" : "Star contact"}
            aria-pressed={!!contact.starred}
            onClick={() => toggleStar(contact.id)}
            className={contact.starred
              ? "rounded-full p-2 text-star transition-colors hover:bg-muted"
              : "rounded-full p-2 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-star"}
          >
            <Star className="h-4 w-4" fill={contact.starred ? "currentColor" : "none"} strokeWidth={1.8} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-border/70 bg-secondary/40 px-8 py-5">
          <label className="col-span-1 block">
            <span className={labelClass}>Stage</span>
            <select
              value={contact.stage}
              onChange={(e) =>
                updateContact(contact.id, { stage: e.target.value as Contact["stage"] })
              }
              className={`${fieldClass} border-border/60 bg-card`}
            >
              {CONTACT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {contactStageMeta[s].label}
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-1 block">
            <span className={labelClass}>Tags</span>
            <input
              value={contact.tags.join(", ")}
              onChange={(e) =>
                updateContact(contact.id, {
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Tech PM, Referral offered"
              className={`${fieldClass} border-border/60 bg-card`}
            />
          </label>

          <label className="col-span-1 block">
            <span className={labelClass}>Next action</span>
            <input
              value={contact.nextAction ?? ""}
              onChange={(e) => updateContact(contact.id, { nextAction: e.target.value })}
              placeholder="Nothing scheduled"
              className={`${fieldClass} border-border/60 bg-card`}
            />
          </label>

          <label className="col-span-1 block">
            <span className={labelClass}>Due</span>
            <input
              type="date"
              value={contact.nextActionDue ?? ""}
              onChange={(e) => updateContact(contact.id, { nextActionDue: e.target.value })}
              className={`${fieldClass} border-border/60 bg-card`}
            />
          </label>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-6">
          <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
            Notes
          </h3>
          <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
            What you learned, in your own words.
          </p>

          <NoteSummary contact={contact} />


          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-1 focus-within:border-ring">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder="Coffee chat went long — she said the team is reorganising in the spring…"
              className="w-full resize-none rounded-xl bg-transparent px-4 py-3 font-display text-[0.95rem] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between px-4 pb-2.5 pt-1">
              <span className="text-[0.7rem] text-muted-foreground/70">
                Saved with today's date.
              </span>
              <button
                disabled={!draft.trim()}
                onClick={() => {
                  addNote(contact.id, draft.trim());
                  setDraft("");
                }}
                className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-semibold text-primary-foreground transition-opacity disabled:opacity-35"
              >
                Add note
              </button>
            </div>
          </div>

          <ol className="mt-7 space-y-6 border-l border-border pl-5">
            {contact.notes.length === 0 && (
              <li className="-ml-5 list-none font-display text-[0.9rem] italic text-muted-foreground">
                Nothing written down yet.
              </li>
            )}
            {[...contact.notes]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((note) => (
              <li key={note.id} className="relative list-none">
                <span
                  className="absolute -left-[1.6rem] top-[0.45rem] h-2 w-2 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  {formatDate(note.date)}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap font-display text-[0.95rem] leading-[1.75] text-foreground/90">
                  {note.body}
                </p>
                </li>
              ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
