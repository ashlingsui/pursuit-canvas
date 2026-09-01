# Recruiting Pipeline Tracker — Design Prototype

A single-user, frontend-only instrument for tracking outreach contacts and job applications through a multi-month search. All data is hardcoded mock data held in React state, so drag, edit, and note-writing work fully in the session and are trivial to swap for a real database later.

## Structure

- `/` — Contacts board (default)
- `/applications` — Applications board
- A shared top bar with the app mark, a Contacts/Applications toggle, search field, and a single "Add" action that adapts to the active board.

## Contacts board

Six columns: Not contacted, Reached out, Responded, Chat scheduled, First chat complete, Ongoing. Each header shows stage name plus a live count.

Card: name, "Org · affiliation" line, up to three small tags, and a next-action row when one exists (what + when). Overdue actions read as urgent, actions due within a few days read as upcoming, everything else stays quiet.

Cards drag between columns and reorder within a column. An empty column shows a soft, stage-specific prompt rather than a blank box (e.g. "Nobody waiting here — good.").

## Applications board

Six columns: Applied, Referred, Screen, Round 1, Final, Offer. Card: company, role, date applied, resume-version chip (e.g. `Amazon_ALA`), and a "Referred by ..." line when present.

Setting aside: each application card has a quiet overflow action to archive it as *Rejected* or *Ghosted*. Archived items leave the board and collect in a collapsible "Set aside" drawer pinned at the bottom of the board, with a count and a one-click restore. Keeps the loss visible-but-optional rather than deleted.

## Contact detail panel

Clicking a contact card opens a right-side slide-over:

- Editable fields: name, org, affiliation, stage, tags, next action + due date.
- A dated notes thread below: a generous, roomy composer (multi-line, auto-growing, calm typography) and entries stamped with date, newest first. Written to feel like a journal page, not a comment box.

## Design direction

Warm off-white paper canvas, one restrained ink-dark text tone, and an editorial type pairing (a distinctive display face for headings/stage names, a clean humanist sans for body and card text). Generous column gutters, soft card elevation, rounded-but-not-bubbly corners.

Color carries progression: the six stages walk a single continuous hue ramp from cool/quiet at "Not contacted" to warm/luminous at "Ongoing" (and at "Offer" on the applications board). Each column gets a thin accent rule and tinted header; the cards themselves stay mostly neutral so the board reads as one gradient of momentum rather than six unrelated colors. Small delights: subtle lift and shadow while dragging, a gentle settle animation on drop, counts that animate on change.

## Mock data

- 20 contacts, unevenly weighted toward "Not contacted", invented names/companies, mixed tags, two overdue next actions and two upcoming ones.
- 9 applications across the six stages, plus two pre-archived set-aside items so that state is visible.

## Technical notes

- TanStack Start routes: rewrite `src/routes/index.tsx` (contacts) and add `src/routes/applications.tsx`; shared chrome in `__root.tsx`. Each route gets its own `head()` metadata.
- Drag and drop via `@dnd-kit/core` + `@dnd-kit/sortable`.
- Mock data and types in `src/data/` ; board state lifted into a shared client-side store (React context + `useState`) so contacts, applications, notes, and archive edits persist across the two routes for the session.
- Tokens (palette, stage ramp, fonts, radii, shadows) defined in `src/styles.css` under `@theme inline`; fonts loaded via `<link>` in `__root.tsx`. No hardcoded color utilities in components.
