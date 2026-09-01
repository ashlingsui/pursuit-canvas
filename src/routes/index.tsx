import { createFileRoute } from "@tanstack/react-router";
import { ContactsBoard } from "@/components/board/ContactsBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contacts — Groundwork Pipeline Tracker" },
      {
        name: "description",
        content:
          "Track outreach contacts across six stages, from not contacted to ongoing, with next actions and dated notes.",
      },
      { property: "og:title", content: "Contacts — Groundwork Pipeline Tracker" },
      {
        property: "og:description",
        content: "A personal board for every conversation in your job search.",
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return <ContactsBoard />;
}
