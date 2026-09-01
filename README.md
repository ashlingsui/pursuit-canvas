# Prospect Palette

Build a personal recruiting pipeline tracker. Single user, no auth, no backend.

Use hardcoded mock data in the frontend. This is a design prototype: I want to

see your best design instincts applied to a real productivity tool, and I'll

wire up the real database separately afterward.

WHO USES THIS AND WHEN

One person, checking this a few times a week to see who to follow up with and

where each job application stands. Not a public-facing product, not a sales

dashboard — a personal instrument they'll live in during a multi-month job

search. It should feel good to open even on a discouraging week.

SCREENS

1. Contacts board (default view)

2. Applications board (top-level tab or toggle to switch)

3. Contact detail panel, opens on card click

CONTACTS BOARD

Six columns, in this order:

  Not contacted → Reached out → Responded → Chat scheduled →

  First chat complete → Ongoing

Column header shows the stage name and a count.

Card contents:

  - Name

  - Org + affiliation, e.g. "Amazon · Haas 2027" or "Stripe · Haas alum 2019"

  - A couple of small tags, e.g. "Tech PM", "Healthcare", "Referral offered"

  - If a next action exists: what it is and when it's due

Drag cards between columns and reorder within a column.

APPLICATIONS BOARD

Columns: Applied → Referred → Screen → Round 1 → Final → Offer

Card contents:

  - Company, role, date applied

  - Which resume version was sent (short label, e.g. "Amazon_ALA")

  - If referred: who referred them

Rejected/ghosted applications are not columns in the main flow — give me some

way to set an application aside without it cluttering the active board (your

call on the mechanism).

CONTACT DETAIL PANEL

All fields editable. A dated notes thread underneath — this is where I'll log

what I learned from a coffee chat, so it should feel like a good place to

actually write, not just a cramped comment box.

ALSO

- Add a new contact / application

- Search or filter by name/org

- Something sensible for empty columns

DESIGN DIRECTION — this is the part I want you to own

Go for clean, colorful, artistic, elegant, modern. Use your own judgment on

typography, color palette, spacing, and how the boards and cards should look

and feel. Don't default to a generic admin-dashboard template — I want this to

feel considered and a little delightful, like a well-designed piece of

personal software, not enterprise SaaS.

The one thing I'll ask you to think about, not solve a specific way: this

board represents real progress through a job search, stage by stage. If color

can help that sense of progression feel good rather than arbitrary, great —

but that's your design call, not a spec I'm handing you.

MOCK DATA

About 20 contacts spread unevenly across the six stages (most in "Not

contacted"), and about 9 applications across their stages. Invented names and

companies only. Give a couple of contacts overdue or upcoming next actions so

those states are visible.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pursuit-canvas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9d8938c7-774e-435a-9d14-5eadbcf26ffa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
