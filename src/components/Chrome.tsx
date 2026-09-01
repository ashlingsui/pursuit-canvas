import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_STAGES, APP_STAGES, appStageMeta, contactStageMeta } from "@/data/types";
import { useBoard } from "@/lib/board-store";
import { dueTone } from "@/lib/dates";
import { AddApplicationDialog, AddContactDialog } from "@/components/board/AddDialogs";
import { cn } from "@/lib/utils";

function Pulse({ onApplications }: { onApplications: boolean }) {
  const { contacts, applications } = useBoard();
  const segments = onApplications
    ? APP_STAGES.map((s) => ({
        accent: appStageMeta[s].accent,
        count: applications.filter((a) => !a.setAside && a.stage === s).length,
      }))
    : CONTACT_STAGES.map((s) => ({
        accent: contactStageMeta[s].accent,
        count: contacts.filter((c) => c.stage === s).length,
      }));
  const total = segments.reduce((n, s) => n + s.count, 0) || 1;

  return (
    <div className="flex h-1.5 w-full max-w-[22rem] overflow-hidden rounded-full bg-muted">
      {segments.map((s, i) => (
        <span
          key={i}
          className="h-full transition-[flex-grow] duration-500"
          style={{ flexGrow: s.count, backgroundColor: s.accent, minWidth: s.count ? "3px" : 0 }}
        />
      ))}
      <span className="sr-only">{total} items in the pipeline</span>
    </div>
  );
}

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onApplications = pathname.startsWith("/applications");
  const { query, setQuery, contacts, displayName } = useBoard();
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const needsAttention = contacts.filter((c) => {
    const tone = dueTone(c.nextActionDue);
    return tone === "overdue" || tone === "soon";
  }).length;

  const tab = "rounded-full px-4 py-1.5 text-[0.82rem] font-semibold transition-colors";

  return (
    <div className="min-h-screen">
      <header className="px-6 pb-4 pt-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
              The search, week by week
            </p>
            <h1 className="mt-1 font-display text-[2.1rem] font-semibold leading-none tracking-tight text-foreground">
              Groundwork
              <span className="ml-2 align-middle text-[0.8rem] font-medium tracking-normal text-muted-foreground">
                Recruiting Pipeline Tracker
              </span>
            </h1>
            <p className="mt-2.5 text-[0.86rem] text-muted-foreground">
              {needsAttention > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{needsAttention}</span> follow-up
                  {needsAttention === 1 ? "" : "s"} want your attention today.
                </>
              ) : (
                <>Nothing overdue. Good week to plant something new.</>
              )}
            </p>
            <div className="mt-4">
              <Pulse onApplications={onApplications} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card p-1 shadow-[var(--shadow-card)]">
              <Link
                to="/contacts"
                className={cn(
                  tab,
                  !onApplications
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Contacts
              </Link>
              <Link
                to="/applications"
                className={cn(
                  tab,
                  onApplications
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Applications
              </Link>
            </div>

            <label className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-2 shadow-[var(--shadow-card)] focus-within:border-ring">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={onApplications ? "Company or role" : "Name or org"}
                className="w-[9.5rem] bg-transparent text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </label>

            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[0.82rem] font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:-translate-y-[1px]"
            >
              <Plus className="h-3.5 w-3.5" />
              {onApplications ? "Application" : "Contact"}
            </button>

            <button
              onClick={signOut}
              title={displayName ? `Signed in as ${displayName}` : "Sign out"}
              className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 py-2.5 text-[0.8rem] font-semibold text-muted-foreground shadow-[var(--shadow-card)] transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{displayName ?? "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {adding &&
        (onApplications ? (
          <AddApplicationDialog onClose={() => setAdding(false)} />
        ) : (
          <AddContactDialog onClose={() => setAdding(false)} />
        ))}
    </div>
  );
}
