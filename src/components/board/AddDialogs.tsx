import { useState, type ReactNode } from "react";
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
  const { addApplication } = useBoard();
  const [form, setForm] = useState({
    company: "",
    role: "",
    appliedOn: new Date().toISOString().slice(0, 10),
    resumeVersion: "",
    referredBy: "",
    stage: APP_STAGES[0] as (typeof APP_STAGES)[number],
  });

  return (
    <Shell
      title="New application"
      subtitle="One more line in the water."
      onClose={onClose}
      onSubmit={() => {
        if (!form.company.trim()) return;
        addApplication({
          company: form.company.trim(),
          role: form.role.trim() || "—",
          appliedOn: form.appliedOn,
          resumeVersion: form.resumeVersion.trim() || "Base",
          stage: form.stage,
          ...(form.referredBy.trim() ? { referredBy: form.referredBy.trim() } : {}),
        });
        onClose();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Company</span>
          <input autoFocus className={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Role</span>
          <input className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
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
            placeholder="Amazon_ALA"
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
          <input
            className={input}
            value={form.referredBy}
            onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
          />
        </label>
      </div>
    </Shell>
  );
}
