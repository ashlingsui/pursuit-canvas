import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles } from "lucide-react";
import { contactStageMeta, type Contact } from "@/data/types";
import { summarizeContactNotes, type NoteSuggestion } from "@/lib/ai.functions";
import { useBoard } from "@/lib/board-store";
import { formatDate } from "@/lib/dates";

const microLabel =
  "text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80";

function acceptClass(done: boolean) {
  return done
    ? "shrink-0 rounded-full bg-muted px-3 py-1 text-[0.7rem] font-semibold text-muted-foreground"
    : "shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[0.7rem] font-semibold text-foreground transition-colors hover:border-ring";
}

export function NoteSummary({ contact }: { contact: Contact }) {
  const { updateContact } = useBoard();
  const run = useServerFn(summarizeContactNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<NoteSuggestion | null>(null);
  const [applied, setApplied] = useState({ summary: false, action: false, stage: false });

  const accent = contactStageMeta[contact.stage].accent;

  async function generate() {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setApplied({ summary: false, action: false, stage: false });
    try {
      const result = await run({
        data: {
          name: contact.name,
          org: contact.org,
          role: contact.role,
          stage: contactStageMeta[contact.stage].label,
          today: new Date().toISOString().slice(0, 10),
          notes: contact.notes.map((n) => ({ date: n.date, body: n.body })),
        },
      });
      setSuggestion(result);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Couldn't read the notes just now. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  const applySummary = () => {
    if (!suggestion) return;
    updateContact(contact.id, {
      aiSummary: { body: suggestion.summary, date: new Date().toISOString().slice(0, 10) },
    });
    setApplied((p) => ({ ...p, summary: true }));
  };

  const applyAction = () => {
    if (!suggestion) return;
    updateContact(contact.id, {
      nextAction: suggestion.nextAction,
      nextActionDue: suggestion.nextActionDue,
    });
    setApplied((p) => ({ ...p, action: true }));
  };

  const applyStage = () => {
    if (!suggestion) return;
    updateContact(contact.id, { stage: suggestion.stage });
    setApplied((p) => ({ ...p, stage: true }));
  };

  if (contact.notes.length === 0) return null;

  return (
    <div className="mt-5">
      {contact.aiSummary && (
        <div
          className="mb-4 rounded-2xl border border-border/70 bg-secondary/40 px-5 py-4"
          style={{ borderLeft: `3px solid ${accent}` }}
        >
          <p className={microLabel}>Summarized {formatDate(contact.aiSummary.date)}</p>
          <p className="mt-1.5 font-display text-[0.95rem] italic leading-[1.7] text-foreground/90">
            {contact.aiSummary.body}
          </p>
        </div>
      )}

      {!suggestion && !loading && (
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[0.78rem] font-semibold text-foreground transition-colors hover:border-ring"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} style={{ color: accent }} />
          {contact.aiSummary ? "Read my notes again" : "Read my notes"}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-1 py-2 text-[0.8rem] text-muted-foreground">
          <span
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: accent }}
          />
          Reading your notes…
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-[0.8rem] text-destructive">
          {error}
        </p>
      )}

      {suggestion && (
        <div
          className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]"
          style={{ borderLeft: `3px solid ${accent}` }}
        >
          <div className="space-y-4 px-5 py-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <p className={microLabel}>Summary</p>
                <button className={acceptClass(!!applied.summary)} onClick={applySummary}>
                  {applied.summary ? <Check className="h-3 w-3" /> : "Keep"}
                </button>
              </div>
              <p className="mt-1.5 font-display text-[0.95rem] leading-[1.7] text-foreground/90">
                {suggestion.summary}
              </p>
            </div>

            <div className="border-t border-border/60 pt-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className={microLabel}>Next action</p>
                <button className={acceptClass(!!applied.action)} onClick={applyAction}>
                  {applied.action ? <Check className="h-3 w-3" /> : "Apply"}
                </button>
              </div>
              <p className="mt-1.5 text-[0.88rem] text-foreground">
                {suggestion.nextAction}{" "}
                <span className="text-muted-foreground">
                  · due {formatDate(suggestion.nextActionDue)}
                </span>
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground/80">
                Now: {contact.nextAction || "nothing scheduled"}
              </p>
            </div>

            <div className="border-t border-border/60 pt-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className={microLabel}>Stage</p>
                <button className={acceptClass(!!applied.stage)} onClick={applyStage}>
                  {applied.stage ? <Check className="h-3 w-3" /> : "Move"}
                </button>
              </div>
              <p className="mt-1.5 text-[0.88rem] text-foreground">
                {contactStageMeta[contact.stage].label}
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span style={{ color: accent }} className="font-semibold">
                  {contactStageMeta[suggestion.stage].label}
                </span>
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground/80">
                {suggestion.stageReason}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-secondary/40 px-5 py-3">
            <button
              onClick={() => setSuggestion(null)}
              className="text-[0.76rem] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                applySummary();
                applyAction();
                applyStage();
              }}
              className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-semibold text-primary-foreground"
            >
              Apply all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
