// Formatting helpers shared by pages and PDFs. API responses carry dates as ISO strings.

export type DateLike = string | number | Date | { _seconds: number } | { seconds: number } | null | undefined;

export function toDate(v: DateLike): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if ('_seconds' in v) return new Date(v._seconds * 1000);
  if ('seconds' in v) return new Date(v.seconds * 1000);
  return null;
}

/** Local calendar day key, e.g. "2026-11-17". */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** ISO timestamp for local noon of a "YYYY-MM-DD" day — safe from timezone day-shifts. */
export function noonISO(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatTime(hhmm: string | undefined): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(start?: string, end?: string): string {
  if (!start) return '';
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** "2026-11" → "November 2026" (or "Nov 2026" when short). */
export function monthLabel(key: string | undefined, short = false): string {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS[(m || 1) - 1] ?? '';
  return `${short ? name.slice(0, 3) : name} ${y}`;
}

export function monthName(key: string | undefined): string {
  if (!key) return '';
  const m = Number(key.split('-')[1]);
  return MONTHS[(m || 1) - 1] ?? '';
}

/** "Tue, 17 Nov" */
export function formatDay(d: Date | null): string {
  if (!d) return '';
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "17 Nov 2026" */
export function formatDate(d: Date | null): string {
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** "Tuesday, 17 November" */
export function formatLongDay(d: Date): string {
  return `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatClock(d: Date | null): string {
  if (!d) return '';
  return formatTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
}

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** "৳4,000" for the UI. */
export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `৳${money.format(n)}`;
}

/** "BDT 4,000" for PDFs (the built-in PDF fonts have no ৳ glyph). */
export function formatMoneyPlain(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `BDT ${money.format(n)}`;
}

/** Whole days from today to `d` (negative = past). */
export function daysFromToday(d: Date, today = new Date()): number {
  return Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000);
}

export function dueLabel(d: Date | null, today = new Date()): { text: string; overdue: boolean; soon: boolean } {
  if (!d) return { text: '', overdue: false, soon: false };
  const n = daysFromToday(d, today);
  if (n < 0) return { text: n === -1 ? 'Overdue by 1 day' : `Overdue by ${-n} days`, overdue: true, soon: false };
  if (n === 0) return { text: 'Due today', overdue: false, soon: true };
  if (n === 1) return { text: 'Due tomorrow', overdue: false, soon: true };
  return { text: `Due ${formatDay(d)}`, overdue: false, soon: n <= 3 };
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Short subject tag for icons: "Physics" → "PHY". */
export function subjectTag(subject: string): string {
  return subject.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || subject.slice(0, 3);
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? '';
}
