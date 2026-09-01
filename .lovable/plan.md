# AI note summary for contacts

Yes — this works without a database. Notes already live in the contact panel; AI runs in a small server function and returns a suggestion you accept or dismiss.

## How it feels

In the contact detail panel, under the notes thread, a quiet **"Read my notes"** action appears once a contact has at least one note.

Clicking it sends that contact's notes (plus name, org, role, current stage) to Lovable AI and returns a suggestion card:

- **Summary** — 2-3 sentences of where things stand.
- **Suggested next action** + a suggested due date.
- **Suggested stage** — one of the six contact stages, with a one-line reason.

Nothing changes automatically. The card shows the current value next to the suggested one, and you can:

- **Apply** — writes summary, next action + due date, and stage into the contact.
- **Apply selectively** — each of the three rows has its own small accept control.
- **Dismiss** — card disappears, notes untouched.

While it thinks, the card shows a calm loading state in the stage accent color. Errors (credits, rate limit) surface as readable text in the card, not a silent failure.

## Where the summary lives

A new `aiSummary` field on the contact (summary text + the date it was generated), shown as a short italic block pinned above the notes thread with a "Summarized <date>" stamp. Re-running replaces it.

## Design

Reuses existing tokens: stage accent rule on the card edge, `font-display` for the summary prose, muted uppercase micro-labels for the three rows, pill accept/dismiss buttons matching the existing "Add note" button. No new colors.

## Technical notes

- `src/lib/ai.functions.ts` — `summarizeContactNotes` via `createServerFn({ method: "POST" })`, zod-validated input (name, org, role, stage, notes array). Calls the Lovable AI Gateway from a `.server.ts` helper with the AI SDK; structured output for `{ summary, nextAction, nextActionDue, stage, stageReason }`. Model: default Gemini flash on the gateway chat path.
- Called from the component with `useServerFn` inside a mutation — never from a route loader.
- `src/data/types.ts` — add optional `aiSummary?: { body: string; date: string }` to `Contact`.
- `src/lib/board-store.tsx` — no new logic beyond reusing `updateContact` for applied fields.
- `src/components/board/ContactPanel.tsx` — new `NoteSummary` subcomponent holding the request state and suggestion card.
- Requires Lovable AI (no external key, no database).
