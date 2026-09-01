import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  APP_STAGES,
  CONTACT_STAGES,
  type AppStage,
  type Application,
  type Contact,
  type ContactStage,
} from "@/data/types";

const contactStage = z.enum(CONTACT_STAGES);
const appStage = z.enum(APP_STAGES);
const setAsideReason = z.enum(["rejected", "ghosted"]);

type ContactRow = {
  id: string;
  name: string;
  org: string;
  role: string;
  affiliation: string;
  tags: string[] | null;
  stage: string;
  starred: boolean;
  next_action: string | null;
  next_action_due: string | null;
  ai_summary: string | null;
  ai_summary_date: string | null;
};

type ApplicationRow = {
  id: string;
  company: string;
  role: string;
  applied_on: string;
  resume_version: string;
  stage: string;
  set_aside: string | null;
  referred_by_contact_id: string | null;
  posting_url: string | null;
  location: string | null;
  seniority: string | null;
  starred: boolean;

};

type NoteRow = { id: string; contact_id: string; note_date: string; body: string };

function toContact(row: ContactRow, notes: NoteRow[]): Contact {
  return {
    id: row.id,
    name: row.name,
    org: row.org,
    role: row.role,
    affiliation: row.affiliation,
    tags: row.tags ?? [],
    stage: row.stage as ContactStage,
    ...(row.starred ? { starred: true } : {}),
    ...(row.next_action ? { nextAction: row.next_action } : {}),
    ...(row.next_action_due ? { nextActionDue: row.next_action_due } : {}),
    ...(row.ai_summary
      ? { aiSummary: { body: row.ai_summary, date: row.ai_summary_date ?? "" } }
      : {}),
    notes: notes
      .filter((n) => n.contact_id === row.id)
      .map((n) => ({ id: n.id, date: n.note_date, body: n.body })),
  };
}

function toApplication(row: ApplicationRow, names: Map<string, string>): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    appliedOn: row.applied_on,
    resumeVersion: row.resume_version,
    stage: row.stage as AppStage,
    ...(row.starred ? { starred: true } : {}),

    ...(row.set_aside ? { setAside: row.set_aside as "rejected" | "ghosted" } : {}),
    ...(row.referred_by_contact_id
      ? {
          referredByContactId: row.referred_by_contact_id,
          ...(names.get(row.referred_by_contact_id)
            ? { referredBy: names.get(row.referred_by_contact_id)! }
            : {}),
        }
      : {}),
    ...(row.posting_url ? { postingUrl: row.posting_url } : {}),
    ...(row.location ? { location: row.location } : {}),
    ...(row.seniority ? { seniority: row.seniority } : {}),
  };
}

export const loadBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const email = typeof claims.email === "string" ? claims.email : "";
      await supabase
        .from("profiles")
        .insert({ id: userId, display_name: email ? email.split("@")[0]! : null });
      await supabase.rpc("seed_demo_data", { _user: userId });
    }

    const [contactsRes, notesRes, appsRes] = await Promise.all([
      supabase.from("contacts").select("*").order("position", { ascending: true }),
      supabase.from("notes").select("id, contact_id, note_date, body").order("note_date", { ascending: false }),
      supabase.from("applications").select("*").order("position", { ascending: true }),
    ]);

    if (contactsRes.error) throw contactsRes.error;
    if (notesRes.error) throw notesRes.error;
    if (appsRes.error) throw appsRes.error;

    const contactRows = (contactsRes.data ?? []) as unknown as ContactRow[];
    const noteRows = (notesRes.data ?? []) as unknown as NoteRow[];
    const appRows = (appsRes.data ?? []) as unknown as ApplicationRow[];

    const names = new Map(contactRows.map((c) => [c.id, c.name]));

    return {
      displayName: profile?.display_name ?? null,
      contacts: contactRows.map((row) => toContact(row, noteRows)),
      applications: appRows.map((row) => toApplication(row, names)),
    };
  });

export type BoardData = Awaited<ReturnType<typeof loadBoard>>;

/** Position for a card dropped into `stage` immediately before `beforeId` (null = end). */
async function nextPosition(
  supabase: { from: (t: string) => any },
  table: "contacts" | "applications",
  stage: string,
  movingId: string,
  beforeId: string | null,
) {
  const { data } = await supabase
    .from(table)
    .select("id, position")
    .eq("stage", stage)
    .order("position", { ascending: true });

  const rows = ((data ?? []) as { id: string; position: number }[]).filter((r) => r.id !== movingId);
  if (beforeId === null) {
    const last = rows[rows.length - 1];
    return last ? last.position + 1 : 1;
  }
  const idx = rows.findIndex((r) => r.id === beforeId);
  if (idx === -1) {
    const last = rows[rows.length - 1];
    return last ? last.position + 1 : 1;
  }
  const target = rows[idx]!.position;
  const prev = idx > 0 ? rows[idx - 1]!.position : target - 1;
  return (prev + target) / 2;
}

export const moveContactFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), stage: contactStage, beforeId: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const position = await nextPosition(
      context.supabase as never,
      "contacts",
      data.stage,
      data.id,
      data.beforeId,
    );
    const { error } = await context.supabase
      .from("contacts")
      .update({ stage: data.stage, position })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const moveApplicationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), stage: appStage, beforeId: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const position = await nextPosition(
      context.supabase as never,
      "applications",
      data.stage,
      data.id,
      data.beforeId,
    );
    const { error } = await context.supabase
      .from("applications")
      .update({ stage: data.stage, position, set_aside: null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const ContactPatch = z.object({
  name: z.string().optional(),
  org: z.string().optional(),
  role: z.string().optional(),
  affiliation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stage: contactStage.optional(),
  starred: z.boolean().optional(),
  nextAction: z.string().nullable().optional(),
  nextActionDue: z.string().nullable().optional(),
  aiSummary: z.object({ body: z.string(), date: z.string() }).nullable().optional(),
});

export const patchContactFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), patch: ContactPatch }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const p = data.patch;
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row["name"] = p.name;
    if (p.org !== undefined) row["org"] = p.org;
    if (p.role !== undefined) row["role"] = p.role;
    if (p.affiliation !== undefined) row["affiliation"] = p.affiliation;
    if (p.tags !== undefined) row["tags"] = p.tags;
    if (p.stage !== undefined) row["stage"] = p.stage;
    if (p.starred !== undefined) row["starred"] = p.starred;
    if (p.nextAction !== undefined) row["next_action"] = p.nextAction || null;
    if (p.nextActionDue !== undefined) row["next_action_due"] = p.nextActionDue || null;
    if (p.aiSummary !== undefined) {
      row["ai_summary"] = p.aiSummary?.body ?? null;
      row["ai_summary_date"] = p.aiSummary?.date ?? null;
    }
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await context.supabase.from("contacts").update(row as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const addContactFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1),
        org: z.string(),
        role: z.string(),
        affiliation: z.string(),
        tags: z.array(z.string()),
        stage: contactStage,
        nextAction: z.string().optional(),
        nextActionDue: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("contacts")
      .select("position")
      .order("position", { ascending: true });
    const first = (rows ?? [])[0] as { position: number } | undefined;
    const { data: inserted, error } = await context.supabase
      .from("contacts")
      .insert({
        user_id: context.userId,
        name: data.name,
        org: data.org,
        role: data.role,
        affiliation: data.affiliation,
        tags: data.tags,
        stage: data.stage,
        position: first ? first.position - 1 : 1,
        next_action: data.nextAction || null,
        next_action_due: data.nextActionDue || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted!.id };
  });

const BatchContactRow = z.object({
  name: z.string().min(1),
  org: z.string(),
  role: z.string().default("—"),
  affiliation: z.string().default("—"),
  tags: z.array(z.string()).default([]),
  nextAction: z.string().nullable().default(null),
  nextActionDue: z.string().nullable().default(null),
});

export const addContactsBatchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.array(BatchContactRow).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("contacts")
      .select("position")
      .order("position", { ascending: true });
    const first = (rows ?? [])[0] as { position: number } | undefined;
    let basePosition = first ? first.position - 1 : 1;

    const inserts = data.map((c) => ({
      user_id: context.userId,
      name: c.name,
      org: c.org,
      role: c.role,
      affiliation: c.affiliation,
      tags: c.tags,
      stage: "not_contacted" as const,
      position: basePosition--,
      next_action: c.nextAction,
      next_action_due: c.nextActionDue,
    }));

    const { error } = await context.supabase.from("contacts").insert(inserts);
    if (error) throw error;
    return { count: inserts.length };
  });

export const addApplicationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        company: z.string().min(1),
        role: z.string(),
        appliedOn: z.string(),
        resumeVersion: z.string(),
        stage: appStage,
        referredByContactId: z.string().nullable().optional(),
        postingUrl: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        seniority: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("applications")
      .select("position")
      .order("position", { ascending: true });
    const first = (rows ?? [])[0] as { position: number } | undefined;
    const { data: inserted, error } = await context.supabase
      .from("applications")
      .insert({
        user_id: context.userId,
        company: data.company,
        role: data.role,
        applied_on: data.appliedOn,
        resume_version: data.resumeVersion,
        stage: data.stage,
        position: first ? first.position - 1 : 1,
        referred_by_contact_id: data.referredByContactId || null,
        posting_url: data.postingUrl || null,
        location: data.location || null,
        seniority: data.seniority || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted!.id };
  });

export const starApplicationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), starred: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ starred: data.starred })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });


export const setApplicationAsideFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), reason: setAsideReason.nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ set_aside: data.reason })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const addNoteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ contactId: z.string(), body: z.string().min(1), date: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("notes")
      .insert({
        user_id: context.userId,
        contact_id: data.contactId,
        body: data.body,
        note_date: data.date,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted!.id };
  });
