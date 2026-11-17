// Schedule logic: which tuitions meet today, which scheduled days were missed, what's next.
import { addDays, dateKey, startOfDay, toDate } from './format';
import type { TuitionDTO } from './types';

/** When the current open month started (legacy tuitions: the 1st of currentMonthYear). */
export function cycleStart(t: TuitionDTO): Date {
  const d = toDate(t.cycleStartedAt);
  if (d) return startOfDay(d);
  const [y, m] = (t.currentMonthYear || '').split('-').map(Number);
  return y && m ? new Date(y, m - 1, 1) : startOfDay(new Date());
}

export function hasSchedule(t: TuitionDTO): boolean {
  return Array.isArray(t.weekdays) && t.weekdays.length > 0;
}

export function isClassDay(t: TuitionDTO, d: Date): boolean {
  return hasSchedule(t) && t.weekdays!.includes(d.getDay());
}

export function doneKeys(classDates: string[] | undefined): Set<string> {
  const keys = new Set<string>();
  for (const iso of classDates ?? []) {
    const d = toDate(iso);
    if (d) keys.add(dateKey(d));
  }
  return keys;
}

/** Scheduled days in the open month, before today, with no class logged. */
export function missedDays(t: TuitionDTO, done: Set<string>, today = new Date()): Date[] {
  if (!hasSchedule(t)) return [];
  const out: Date[] = [];
  const end = startOfDay(today);
  for (let d = cycleStart(t); d < end; d = addDays(d, 1)) {
    if (isClassDay(t, d) && !done.has(dateKey(d))) out.push(d);
  }
  return out;
}

/** Remaining scheduled days in the calendar month that contains `today` (today excluded). */
export function upcomingDays(t: TuitionDTO, today = new Date()): Date[] {
  if (!hasSchedule(t)) return [];
  const out: Date[] = [];
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  for (let d = addDays(startOfDay(today), 1); d <= monthEnd; d = addDays(d, 1)) {
    if (isClassDay(t, d)) out.push(d);
  }
  return out;
}

/** Number of class days a weekday set gives in a given month — used to suggest "classes per month". */
export function classDaysInMonth(weekdays: number[], year: number, month: number): number {
  let n = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= days; i++) if (weekdays.includes(new Date(year, month, i).getDay())) n++;
  return n;
}

/** Next scheduled class (today counts if its start time hasn't passed). */
export function nextClass(t: TuitionDTO, now = new Date()): Date | null {
  if (!hasSchedule(t)) return null;
  const [h, m] = (t.startTime || '00:00').split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = addDays(startOfDay(now), i);
    if (!isClassDay(t, d)) continue;
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
    if (at > now) return at;
  }
  return null;
}

export function progress(t: TuitionDTO): number {
  if (!t.plannedClassesPerMonth) return 0;
  return Math.min(1, (t.takenClasses || 0) / t.plannedClassesPerMonth);
}

export function isOwner(t: TuitionDTO, userId: string | undefined): boolean {
  return !!userId && t.teacherId === userId;
}
