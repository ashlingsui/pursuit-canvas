# Real backend + tech/startup data + smarter applications

Four changes: swap the demo data for tech/startup companies, move everything into a real
database behind a login, let you paste a job posting link to auto-fill an application, and
turn "Referred by" into a picker fed by your contacts.

## 1. Tech / startup demo data

All 20 contacts and 11 applications get rewritten around plausible startup and tech
companies (infra, dev tools, AI, fintech, healthtech, climate) with matching roles —
Product Manager, Founding Engineer, Growth Lead, Design Lead, Platform PM, and so on.
Affiliations stay the same flavor (school cohort, alum, referral, former manager). Stage
spread, starred contacts, overdue and upcoming next actions, and notes all carry over so
the board still tells a story on first load.

## 2. Login + database

- Cloud backend enabled: email + password sign-in, plus a Google option.
- A public landing/sign-in page; the two boards move behind the login.
- Your data is private to your account — nobody else can read or write it.
- The demo tech data is seeded into your account's tables so the boards are populated
  the first time you sign in.
- A small profile record (display name) is created automatically on signup so the header
  can greet you and show a sign-out control.

Everything that currently works in-session — drag between stages, edit fields, star,
add notes, set aside / put back, AI note summary — now saves permanently.

## 3. Paste a job posting link

In the "New application" dialog, a link field appears first with a "Fetch details" action:

- Paste a posting URL, the server fetches the page and reads it with AI.
- It fills company, role, and whatever else it can find — location, seniority, and a short
  summary note attached to the application.
- Every field stays editable, so a bad or partial read is a two-second fix rather than a
  dead end. If a site blocks fetching, you get a plain "couldn't read that page, fill it in
  manually" message.
- The link is stored on the application and shown on the card as a small "View posting"
  link.

## 4. "Referred by" comes from contacts

The free-text field becomes a searchable select listing your contacts (name — company).
Includes a "No referral" option. Existing referral names are matched to contacts where
possible. Cards show the referrer as before, and the application links to that contact.

## Technical notes

- Tables: `profiles`, `contacts`, `applications`, `notes`. RLS on every table scoped to
  `auth.uid()`, with explicit grants; `applications.referred_by_contact_id` is a nullable
  FK to `contacts` with `ON DELETE SET NULL`. New columns on applications: `posting_url`,
  `location`, `seniority`.
- Seed rows ship as literal INSERTs in the migration, keyed to the signed-in user via a
  first-run copy step so each account gets its own copy.
- `board-store.tsx` keeps its current API but is backed by TanStack Query + authenticated
  server functions instead of `useState` over mock data, so component code barely changes.
- Link parsing: a server function fetches the URL, strips to text, and calls the existing
  AI gateway with a Zod-validated structured output (company, role, location, seniority,
  summary). Failures return a typed fallback, never a thrown error into the dialog.
- Boards move under the managed `_authenticated` layout; `/` becomes a public sign-in
  page. Sitemap and per-route metadata updated accordingly.
