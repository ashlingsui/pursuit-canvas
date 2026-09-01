import { useMemo, useState } from "react";
import { Download, FileUp, Loader2, Upload, X } from "lucide-react";
import { CONTACTS_TEMPLATE, downloadTemplate, parseCsv } from "@/lib/csv";
import { useBoard } from "@/lib/board-store";

const input =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-[0.88rem] text-foreground outline-none focus:border-ring";
const label = "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80";

function Shell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />
      <div className="animate-settle relative w-full max-w-[34rem] rounded-3xl border border-border/70 bg-card p-7 shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BatchUploadContacts({ onClose }: { onClose: () => void }) {
  const { addContactsBatch } = useBoard();
  const [raw, setRaw] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!raw) return { rows: [] as Record<string, string>[], errors: [] as string[] };
    try {
      const { rows } = parseCsv(raw);
      const errors: string[] = [];

      rows.forEach((row, idx) => {
        const line = idx + 2;
        if (!row["name"]?.trim()) errors.push(`Row ${line}: missing name`);
        if (!row["company"]?.trim()) errors.push(`Row ${line}: missing company`);
      });

      return { rows, errors };
    } catch (e) {
      return { rows: [], errors: [e instanceof Error ? e.message : "Couldn't read that CSV."] };
    }
  }, [raw]);

  const validRows = parsed.rows.filter((r) => r["name"]?.trim() && r["company"]?.trim());

  function handleFile(file: File) {
    setFileName(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result));
    reader.onerror = () => setParseError("Couldn't read that file.");
    reader.readAsText(file);
  }

  function save() {
    if (validRows.length === 0 || parsed.errors.length > 0) return;
    setSaving(true);
    addContactsBatch(
      validRows.map((r) => {
        const name = r["name"]?.trim() ?? "";
        const org = r["company"]?.trim() ?? "";
        return {
          name,
          org,
          role: r["role"]?.trim() || "—",
          affiliation: r["affiliation"]?.trim() || "—",
          tags: r["tags"]
            ? r["tags"]
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          ...(r["next_action"]?.trim() ? { nextAction: r["next_action"].trim() } : {}),
          ...(r["next_action_due"]?.trim() ? { nextActionDue: r["next_action_due"].trim() } : {}),
        };
      }),
    );
    onClose();
  }

  return (
    <Shell
      title="Upload contacts"
      subtitle="CSV of people to add to the Not contacted column."
      onClose={onClose}
    >
      <div className="mt-5 grid gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => downloadTemplate("groundwork-contacts-template.csv", CONTACTS_TEMPLATE)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[0.78rem] font-semibold text-foreground transition-colors hover:bg-secondary/60"
          >
            <Download className="h-3.5 w-3.5" />
            Download template
          </button>
          <span className="text-[0.75rem] text-muted-foreground">Columns: name, company, role, affiliation, tags, next_action, next_action_due</span>
        </div>

        <label className="block">
          <span className={label}>CSV file</span>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
              id="contacts-csv"
            />
            <label
              htmlFor="contacts-csv"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-[0.82rem] font-semibold text-foreground transition-colors hover:bg-secondary/50"
            >
              <FileUp className="h-4 w-4 text-muted-foreground" />
              {fileName ? fileName : "Click to choose a CSV file"}
            </label>
          </div>
        </label>

        {parseError && <p className="text-[0.8rem] text-destructive">{parseError}</p>}

        {parsed.errors.length > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-[0.75rem] font-semibold text-destructive">Fix before uploading:</p>
            <ul className="mt-1 list-inside list-disc text-[0.75rem] text-destructive/90">
              {parsed.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validRows.length > 0 && parsed.errors.length === 0 && (
          <div className="max-h-[12rem] overflow-auto rounded-xl border border-border/70 bg-secondary/20 p-3">
            <p className="text-[0.75rem] font-semibold text-muted-foreground">
              Ready to add <span className="text-foreground">{validRows.length}</span> contacts
            </p>
            <ul className="mt-2 grid gap-1">
              {validRows.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-[0.78rem] text-foreground">
                  <span className="truncate font-medium">{r["name"]}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="truncate text-muted-foreground">{r["company"]}</span>
                </li>
              ))}
              {validRows.length > 8 && (
                <li className="text-[0.75rem] text-muted-foreground">…and {validRows.length - 8} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.8rem] font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={validRows.length === 0 || parsed.errors.length > 0 || saving}
            className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-[0.8rem] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : `Upload ${validRows.length || ""}`}
          </button>
        </div>
      </div>
    </Shell>
  );
}
