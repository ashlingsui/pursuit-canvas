import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockApplications, mockContacts } from "@/data/mock";
import type {
  AppStage,
  Application,
  Contact,
  ContactStage,
  Note,
  SetAsideReason,
} from "@/data/types";

type BoardStore = {
  contacts: Contact[];
  applications: Application[];
  query: string;
  setQuery: (q: string) => void;
  moveContact: (id: string, stage: ContactStage, beforeId: string | null) => void;
  moveApplication: (id: string, stage: AppStage, beforeId: string | null) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  addNote: (contactId: string, body: string) => void;
  addContact: (contact: Omit<Contact, "id" | "notes">) => void;
  addApplication: (app: Omit<Application, "id">) => void;
  setAside: (id: string, reason: SetAsideReason) => void;
  restore: (id: string) => void;
};

const BoardContext = createContext<BoardStore | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

function omitSetAside(app: Application): Application {
  const { setAside: _setAside, ...rest } = app;
  return rest;
}

function reorder<T extends { id: string }>(items: T[], id: string, beforeId: string | null): T[] {
  const moving = items.find((i) => i.id === id);
  if (!moving) return items;
  const rest = items.filter((i) => i.id !== id);
  if (beforeId === null) return [...rest, moving];
  const idx = rest.findIndex((i) => i.id === beforeId);
  if (idx === -1) return [...rest, moving];
  return [...rest.slice(0, idx), moving, ...rest.slice(idx)];
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [query, setQuery] = useState("");

  const value = useMemo<BoardStore>(
    () => ({
      contacts,
      applications,
      query,
      setQuery,
      moveContact: (id, stage, beforeId) =>
        setContacts((prev) =>
          reorder(
            prev.map((c) => (c.id === id ? { ...c, stage } : c)),
            id,
            beforeId,
          ),
        ),
      moveApplication: (id, stage, beforeId) =>
        setApplications((prev) =>
          reorder(
            prev.map((a) => (a.id === id ? { ...omitSetAside(a), stage } : a)),
            id,
            beforeId,
          ),
        ),
      updateContact: (id, patch) =>
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      addNote: (contactId, body) =>
        setContacts((prev) =>
          prev.map((c) => {
            if (c.id !== contactId) return c;
            const note: Note = { id: uid(), date: new Date().toISOString().slice(0, 10), body };
            return { ...c, notes: [note, ...c.notes] };
          }),
        ),
      addContact: (contact) => setContacts((prev) => [{ ...contact, id: uid(), notes: [] }, ...prev]),
      addApplication: (app) => setApplications((prev) => [{ ...app, id: uid() }, ...prev]),
      setAside: (id, reason) =>
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, setAside: reason } : a))),
      restore: (id) =>
        setApplications((prev) => prev.map((a) => (a.id === id ? omitSetAside(a) : a))),
    }),
    [contacts, applications, query],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used inside BoardProvider");
  return ctx;
}
