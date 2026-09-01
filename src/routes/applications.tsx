import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsBoard } from "@/components/board/ApplicationsBoard";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Groundwork Pipeline Tracker" },
      {
        name: "description",
        content:
          "See every job application from applied through offer, with resume versions, referrals, and a set-aside drawer.",
      },
      { property: "og:title", content: "Applications — Groundwork Pipeline Tracker" },
      {
        property: "og:description",
        content: "Where each application stands, without the rejections cluttering the board.",
      },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return <ApplicationsBoard />;
}
