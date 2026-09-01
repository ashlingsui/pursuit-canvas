import { createContext, useContext, useMemo, useState, type Context, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppStage,
  Application,
  Contact,
  ContactStage,
  Note,
  SetAsideReason,
} from "@/data/types";
import {
  addApplicationFn,
  addContactFn,
  addContactsBatchFn,
  addNoteFn,
  loadBoard,
  moveApplicationFn,
  moveContactFn,
  patchContactFn,
  setApplicationAsideFn,
  starApplicationFn,

  type BoardData,
} from "./board.functions";

type BoardStore = {
  contacts: Contact[];
  applications: Application[];
  displayName: string | null;
  loading: boolean;
  error: Error | null;
  query: string;
  setQuery: (q: string) => void;
  moveContact: (id: string, stage: ContactStage, beforeId: string | null) => void;
  moveApplication: (id: string, stage: AppStage, beforeId: string | null) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  toggleStar: (id: string) => void;
  toggleApplicationStar: (id: string) => void;

  addNote: (contactId: string, body: string) => void;
  addContact: (contact: Omit<Contact, "id" | "notes">) => void;
  addContactsBatch: (contacts: Omit<Contact, "id" | "notes" | "stage">[]) => void;
  addApplication: (app: Omit<Application, "id">) => void;
  setAside: (id: string, reason: SetAsideReason) => void;
  restore: (id: string) => void;
};

const globalScope = globalThis as unknown as {
  __groundworkBoardContext?: Context<BoardStore | null>;
};

// Reuse one context instance across HMR updates so the provider and consumers
// never end up bound to different module copies.
const BoardContext =
  globalScope.__groundworkBoardContext ??
  (globalScope.__groundworkBoardContext = createContext<BoardStore | null>(null));

export const boardQueryKey = ["board"] as const;

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

const emptyBoard: BoardData = { displayName: null, contacts: [], applications: [] };

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
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const board = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => loadBoard(),
    staleTime: 30_000,
  });

  const data = board.data ?? emptyBoard;

  const value = useMemo<BoardStore>(() => {
    const patchCache = (fn: (prev: BoardData) => BoardData) =>
      queryClient.setQueryData<BoardData>(boardQueryKey, (prev) => fn(prev ?? emptyBoard));

    const settle = () => {
      void queryClient.invalidateQueries({ queryKey: boardQueryKey });
    };

    const fail = (error: unknown) => {
      console.error(error);
      settle();
    };

    return {
      contacts: data.contacts,
      applications: data.applications,
      displayName: data.displayName,
      loading: board.isPending,
      error: (board.error as Error | null) ?? null,
      query,
      setQuery,

      moveContact: (id, stage, beforeId) => {
        patchCache((prev) => ({
          ...prev,
          contacts: reorder(
            prev.contacts.map((c) => (c.id === id ? { ...c, stage } : c)),
            id,
            beforeId,
          ),
        }));
        moveContactFn({ data: { id, stage, beforeId } }).then(settle, fail);
      },

      moveApplication: (id, stage, beforeId) => {
        patchCache((prev) => ({
          ...prev,
          applications: reorder(
            prev.applications.map((a) => (a.id === id ? { ...omitSetAside(a), stage } : a)),
            id,
            beforeId,
          ),
        }));
        moveApplicationFn({ data: { id, stage, beforeId } }).then(settle, fail);
      },

      updateContact: (id, patch) => {
        patchCache((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        patchContactFn({
          data: {
            id,
            patch: {
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.org !== undefined ? { org: patch.org } : {}),
              ...(patch.role !== undefined ? { role: patch.role } : {}),
              ...(patch.affiliation !== undefined ? { affiliation: patch.affiliation } : {}),
              ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
              ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
              ...(patch.starred !== undefined ? { starred: patch.starred } : {}),
              ...(patch.nextAction !== undefined ? { nextAction: patch.nextAction ?? null } : {}),
              ...(patch.nextActionDue !== undefined
                ? { nextActionDue: patch.nextActionDue ?? null }
                : {}),
              ...(patch.aiSummary !== undefined ? { aiSummary: patch.aiSummary ?? null } : {}),
            },
          },
        }).catch(fail);
      },

      toggleStar: (id) => {
        const current = data.contacts.find((c) => c.id === id);
        const starred = !current?.starred;
        patchCache((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? { ...c, starred } : c)),
        }));
        patchContactFn({ data: { id, patch: { starred } } }).catch(fail);
      },

      addNote: (contactId, body) => {
        const note: Note = { id: uid(), date: today(), body };
        patchCache((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === contactId ? { ...c, notes: [note, ...c.notes] } : c,
          ),
        }));
        addNoteFn({ data: { contactId, body, date: note.date } }).then(settle, fail);
      },

      addContact: (contact) => {
        patchCache((prev) => ({
          ...prev,
          contacts: [{ ...contact, id: uid(), notes: [] }, ...prev.contacts],
        }));
        addContactFn({
          data: {
            name: contact.name,
            org: contact.org,
            role: contact.role,
            affiliation: contact.affiliation,
            tags: contact.tags,
            stage: contact.stage,
            ...(contact.nextAction ? { nextAction: contact.nextAction } : {}),
            ...(contact.nextActionDue ? { nextActionDue: contact.nextActionDue } : {}),
          },
        }).then(settle, fail);
      },

      addContactsBatch: (contacts) => {
        const newContacts: Contact[] = contacts.map((c) => ({
          ...c,
          id: uid(),
          stage: "not_contacted",
          notes: [],
        }));
        patchCache((prev) => ({
          ...prev,
          contacts: [...newContacts, ...prev.contacts],
        }));
        addContactsBatchFn({
          data: contacts.map((c) => ({
            name: c.name,
            org: c.org,
            role: c.role,
            affiliation: c.affiliation,
            tags: c.tags,
            nextAction: c.nextAction ?? null,
            nextActionDue: c.nextActionDue ?? null,
          })),
        }).then(settle, fail);
      },

      addApplication: (app) => {
        patchCache((prev) => ({
          ...prev,
          applications: [{ ...app, id: uid() }, ...prev.applications],
        }));
        addApplicationFn({
          data: {
            company: app.company,
            role: app.role,
            appliedOn: app.appliedOn,
            resumeVersion: app.resumeVersion,
            stage: app.stage,
            referredByContactId: app.referredByContactId ?? null,
            postingUrl: app.postingUrl ?? null,
            location: app.location ?? null,
            seniority: app.seniority ?? null,
          },
        }).then(settle, fail);
      },

      setAside: (id, reason) => {
        patchCache((prev) => ({
          ...prev,
          applications: prev.applications.map((a) =>
            a.id === id ? { ...a, setAside: reason } : a,
          ),
        }));
        setApplicationAsideFn({ data: { id, reason } }).catch(fail);
      },

      restore: (id) => {
        patchCache((prev) => ({
          ...prev,
          applications: prev.applications.map((a) => (a.id === id ? omitSetAside(a) : a)),
        }));
        setApplicationAsideFn({ data: { id, reason: null } }).catch(fail);
      },
    };
  }, [data, board.isPending, board.error, query, queryClient]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used inside BoardProvider");
  return ctx;
}
