export const CONTACT_STAGES = [
  "not_contacted",
  "reached_out",
  "responded",
  "chat_scheduled",
  "first_chat",
  "ongoing",
] as const;

export type ContactStage = (typeof CONTACT_STAGES)[number];

export const APP_STAGES = [
  "to_be_applied",
  "applied",
  "referred",
  "screen",
  "take_home",
  "round_1",
  "final",
  "offer",
] as const;


export type AppStage = (typeof APP_STAGES)[number];

export type SetAsideReason = "rejected" | "ghosted";

export type Note = {
  id: string;
  date: string; // ISO date
  body: string;
};

export type Contact = {
  id: string;
  name: string;
  org: string;
  role: string;
  affiliation: string;
  tags: string[];
  stage: ContactStage;
  starred?: boolean;
  nextAction?: string;
  nextActionDue?: string; // ISO date
  notes: Note[];
  aiSummary?: { body: string; date: string };
};

export type Application = {
  id: string;
  company: string;
  role: string;
  appliedOn: string; // ISO date
  resumeVersion: string;
  referredByContactId?: string;
  referredBy?: string; // resolved contact name, for display
  postingUrl?: string;
  location?: string;
  seniority?: string;
  stage: AppStage;
  setAside?: SetAsideReason;
};

type StageMeta<T extends string> = {
  id: T;
  label: string;
  accent: string;
  empty: string;
};

export const contactStageMeta: Record<ContactStage, StageMeta<ContactStage>> = {
  not_contacted: {
    id: "not_contacted",
    label: "Not contacted",
    accent: "var(--stage-1)",
    empty: "The well is dry — time to find some new names.",
  },
  reached_out: {
    id: "reached_out",
    label: "Reached out",
    accent: "var(--stage-2)",
    empty: "No notes in the mail. Pick someone from the left.",
  },
  responded: {
    id: "responded",
    label: "Responded",
    accent: "var(--stage-3)",
    empty: "Quiet inbox for now. It usually takes a week.",
  },
  chat_scheduled: {
    id: "chat_scheduled",
    label: "Chat scheduled",
    accent: "var(--stage-4)",
    empty: "Nothing on the calendar yet.",
  },
  first_chat: {
    id: "first_chat",
    label: "First chat complete",
    accent: "var(--stage-5)",
    empty: "First conversations will land here.",
  },
  ongoing: {
    id: "ongoing",
    label: "Ongoing",
    accent: "var(--stage-6)",
    empty: "Room for the people who stick around.",
  },
};

export const appStageMeta: Record<AppStage, StageMeta<AppStage>> = {
  to_be_applied: { id: "to_be_applied", label: "To be applied", accent: "var(--stage-0)", empty: "Roles you want to go after." },
  applied: { id: "applied", label: "Applied", accent: "var(--stage-1)", empty: "Nothing new out the door." },
  referred: { id: "referred", label: "Referred", accent: "var(--stage-2)", empty: "No warm intros in flight." },
  screen: { id: "screen", label: "Screen", accent: "var(--stage-3)", empty: "No screens booked." },
  round_1: { id: "round_1", label: "Round 1", accent: "var(--stage-4)", empty: "Nobody at round one yet." },
  final: { id: "final", label: "Final", accent: "var(--stage-5)", empty: "The finals shelf is empty." },
  offer: { id: "offer", label: "Offer", accent: "var(--stage-6)", empty: "Saving this space for good news." },
};
