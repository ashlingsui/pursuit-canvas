# Applications board: uniform cards, starring, and a "Take home" stage

## 1. Equal-height application cards

Right now each application card sizes itself to whatever fields exist (referral line, location/seniority, posting link), so a column looks ragged. Fix by giving every card a fixed structure:

- Company + role at top, resume-version chip and applied date next.
- A fixed-height meta block that always reserves room for the referral line and the location/seniority line (empty rows render as blank space, not collapsed).
- "View posting" pinned to the bottom of the card; when there's no link, the row stays as empty space so heights still match.
- One shared min-height so cards with fewer fields match the tallest layout.

## 2. Star an application

Same behavior as contacts: a star button on the card that toggles instantly and persists.

- Add a `starred` flag to applications in the database.
- Star button top-right on the card (next to the existing "set aside" menu), filled in the star color when on.
- Starred applications sort to the top of their column, matching how starred contacts behave.

## 3. New "Take home" stage

Pipeline becomes: To be applied → Applied → Referred → Screen → **Take home** → Round 1 → Final → Offer.

- Add the stage to the board, the New Application dialog picker, and the stage color ramp (a new hue between Screen and Round 1 so progression still reads left-to-right).
- Existing cards keep their current stage; the new column simply appears in position.

## Technical notes

- Migration: `ALTER TABLE public.applications ADD COLUMN starred boolean NOT NULL DEFAULT false;` (existing RLS/grants already cover it). Existing `stage` values are plain text, so `take_home` needs no schema change; the seed function gets one demo card in the new stage.
- `src/data/types.ts`: insert `take_home` into `APP_STAGES` between `screen` and `round_1`, add `appStageMeta` entry, add `starred?: boolean` to `Application`.
- `src/styles.css`: add a `--stage-7` token and shift the applications ramp so 8 columns each get a distinct hue.
- `src/lib/board.functions.ts`: include `starred` in the applications select/mapper, extend the app-stage zod enum, add a `patchApplicationFn`-style starred update (or extend the existing application patch path).
- `src/lib/board-store.tsx`: add `toggleApplicationStar` with the same optimistic-update pattern as `toggleStar`.
- `src/components/board/ApplicationCard.tsx`: restructure `ApplicationCardBody` for fixed rows/min-height and add the star button; `ApplicationsBoard.tsx` sorts starred first within each column.
