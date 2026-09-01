export type DueTone = "overdue" | "soon" | "later";

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dueTone(iso?: string): DueTone | null {
  if (!iso) return null;
  const diff = Math.round((new Date(`${iso}T00:00:00`).getTime() - startOfToday().getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff <= 3) return "soon";
  return "later";
}

export function formatDue(iso?: string) {
  if (!iso) return "";
  const diff = Math.round((new Date(`${iso}T00:00:00`).getTime() - startOfToday().getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff <= 6) return `in ${diff} days`;
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
