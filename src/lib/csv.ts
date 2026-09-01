export type CsvRow = Record<string, string>;

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === '\n' && !inQuotes) {
      lines.push(current);
      current = "";
      continue;
    }

    if (char === '\r') continue;

    current += char;
  }

  if (current || text.endsWith('\n')) lines.push(current);

  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = splitFields(nonEmpty[0]!).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: CsvRow[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const fields = splitFields(nonEmpty[i]!);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (fields[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitFields(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

export function downloadTemplate(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CONTACTS_TEMPLATE = `name,company,role,affiliation,tags,next_action,next_action_due
Ada Lovelace,Nimbus Forge,Engineering Manager,Haas 2027,"warm intro, alumni",Send LinkedIn note,2026-09-05
Grace Hopper,Rowan Data,Staff Engineer,Former colleague,,Email referral ask,2026-09-08
`;
