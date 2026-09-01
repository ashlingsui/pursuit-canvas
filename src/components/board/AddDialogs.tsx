import { useState, type ReactNode } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { readJobPosting } from "@/lib/job-posting.functions";
import { APP_STAGES, CONTACT_STAGES, appStageMeta, contactStageMeta } from "@/data/types";
import { useBoard } from "@/lib/board-store";

const input =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-[0.88rem] text-foreground outline-none focus:border-ring";
const label = "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80";

function Shell({
  title,
  subtitle,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="animate-settle relative w-full max-w-[30rem] rounded-3xl border border-border/70 bg-card p-7 shadow-[var(--shadow-lift)]"
      >
        <h2 className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{subtitle}</p>
        <div className="mt-5 grid gap-3.5">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.8rem] font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2 text-[0.8rem] font-semibold text-primary-foreground"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddContactDialog({ onClose }: { onClose: () => void }) {
  const { addContact } = useBoard();
  const [form, setForm] = useState({
    name: "",
    org: "",
    role: "",
    affiliation: "",
    tags: "",
    stage: CONTACT_STAGES[0] as (typeof CONTACT_STAGES)[number],
    nextAction: "",
    nextActionDue: "",
  });

  return (
    <Shell
      title="New contact"
      subtitle="Somebody worth talking to."
      onClose={onClose}
      onSubmit={() => {
        if (!form.name.trim()) return;
        addContact({
          name: form.name.trim(),
          org: form.org.trim() || "—",
          role: form.role.trim() || "—",
          affiliation: form.affiliation.trim() || "—",
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          stage: form.stage,
          ...(form.nextAction.trim() ? { nextAction: form.nextAction.trim() } : {}),
          ...(form.nextActionDue ? { nextActionDue: form.nextActionDue } : {}),
        });
        onClose();
      }}
    >
      <label className="block">
        <span className={label}>Name</span>
        <input autoFocus className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Company</span>
          <input className={input} value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Role</span>
          <input
            className={input}
            placeholder="Product Manager"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={label}>Affiliation</span>
          <input
            className={input}
            placeholder="Haas 2027"
            value={form.affiliation}
            onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
          />
        </label>
      </div>
      <label className="block">
        <span className={label}>Tags</span>
        <input
          className={input}
          placeholder="Tech PM, Referral offered"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
      </label>
      <label className="block">
        <span className={label}>Stage</span>
        <select
          className={input}
          value={form.stage}
          onChange={(e) => setForm({ ...form, stage: e.target.value as typeof form.stage })}
        >
          {CONTACT_STAGES.map((s) => (
            <option key={s} value={s}>
              {contactStageMeta[s].label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className={label}>Next action</span>
          <input
            className={input}
            value={form.nextAction}
            onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={label}>Due</span>
          <input
            type="date"
            className={input}
            value={form.nextActionDue}
            onChange={(e) => setForm({ ...form, nextActionDue: e.target.value })}
          />
        </label>
      </div>
    </Shell>
  );
}

export function AddApplicationDialog({ onClose }: { onClose: () => void }) {
  const { addApplication, contacts } = useBoard();
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: "",
    role: "",
    appliedOn: new Date().toISOString().slice(0, 10),
    resumeVersion: "",
    referredByContactId: "",
    location: "",
    seniority: "",
    stage: APP_STAGES[0] as (typeof APP_STAGES)[number],
  });

  const sortedContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));

  async function fetchDetails() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setFetching(true);
    setFetchError(null);
    setFetchNote(null);
    try {
      const result = await readJobPosting({ data: { url: trimmed } });
      if (!result.ok) {
        setFetchError(result.error);
        return;
      }
      const d = result.details;
      setForm((f) => ({
        ...f,
        company: d.company || f.company,
        role: d.role || f.role,
        location: d.location || f.location,
        seniority: d.seniority || f.seniority,
      }));
      setFetchNote(d.summary || "Filled in what the posting listed. Edit anything that looks off.");
    } catch {
      setFetchError("Couldn't read that link. Fill it in manually.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <Shell
      title="New application"
      subtitle="Paste the posting link and I'll fill in what I can."
      onClose={onClose}
      onSubmit={() => {
        if (!form.company.trim()) return;
        const referrerName = contacts.find((c) => c.id === form.referredByContactId)?.name;
        addApplication({
          company: form.company.trim(),
          role: form.role.trim() || "—",
          appliedOn: form.appliedOn,
          resumeVersion: form.resumeVersion.trim() || "Base",
          stage: form.stage,
          ...(form.referredByContactId ? { referredByContactId: form.referredByContactId } : {}),
          ...(referrerName ? { referredBy: referrerName } : {}),
          ...(url.trim() ? { postingUrl: url.trim() } : {}),
          ...(form.location.trim() ? { location: form.location.trim() } : {}),
          ...(form.seniority.trim() ? { seniority: form.seniority.trim() } : {}),
        });
        onClose();
      }}
    >
      <label className="block">
        <span className={label}>Job posting link</span>
        <div className="flex gap-2">
          <input
            autoFocus
            type="url"
            placeholder="https://…"
            className={input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={fetchDetails}
            disabled={fetching || !url.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[0.78rem] font-semibold text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50"
          >
            {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {fetching ? "Reading" : "Fetch details"}
          </button>
        </div>
        {fetchNote && <p className="mt-1.5 text-[0.75rem] text-muted-foreground">{fetchNote}</p>}
        {fetchError && <p className="mt-1.5 text-[0.75rem] text-destructive">{fetchError}</p>}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Company</span>
          <input className={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Role</span>
          <input className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Location</span>
          <input
            className={input}
            placeholder="Remote"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={label}>Seniority</span>
          <input
            className={input}
            placeholder="Senior"
            value={form.seniority}
            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Date applied</span>
          <input
            type="date"
            className={input}
            value={form.appliedOn}
            onChange={(e) => setForm({ ...form, appliedOn: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={label}>Resume version</span>
          <input
            className={input}
            placeholder="Nimbus_Infra"
            value={form.resumeVersion}
            onChange={(e) => setForm({ ...form, resumeVersion: e.target.value })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Stage</span>
          <select
            className={input}
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as typeof form.stage })}
          >
            {APP_STAGES.map((s) => (
              <option key={s} value={s}>
                {appStageMeta[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Referred by</span>
          <select
            className={input}
            value={form.referredByContactId}
            onChange={(e) => setForm({ ...form, referredByContactId: e.target.value })}
          >
            <option value="">No referral</option>
            {sortedContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.org}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Shell>
  );
}
