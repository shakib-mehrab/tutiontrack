'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Badge, Button, Card, Ring, cn } from '@/components/ui/core';
import { Field, FormError, Input, WeekdayPicker } from '@/components/ui/form';
import { ConfirmSheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { SlipButton } from '@/components/documents';
import { errorMessage } from '@/lib/client/api';
import { WEEKDAY_LETTER, WEEKDAY_SHORT, dateKey, formatDate, formatMoney, formatTimeRange, monthLabel, startOfDay, toDate } from '@/lib/client/format';
import { setPaid } from '@/lib/client/hooks';
import { classDaysInMonth, cycleStart, doneKeys, hasSchedule, progress } from '@/lib/client/schedule';
import type { ClassLogDTO, TuitionDTO } from '@/lib/client/types';

/* ---------- Schedule text ---------- */

export function scheduleText(t: TuitionDTO): string {
  return hasSchedule(t) ? t.weekdays!.map((d) => WEEKDAY_SHORT[d]).join(' · ') : `${t.daysPerWeek} days a week`;
}

export function ScheduleChips({ t }: { t: TuitionDTO }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasSchedule(t) ? (
        t.weekdays!.map((d) => (
          <span key={d} className="rounded-[10px] bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary-deep">
            {WEEKDAY_SHORT[d]}
          </span>
        ))
      ) : (
        <span className="rounded-[10px] bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary-deep">{t.daysPerWeek} days / week</span>
      )}
      <span className="ml-1 text-[13px] font-semibold text-muted">{formatTimeRange(t.startTime, t.endTime)}</span>
    </div>
  );
}

/* ---------- List card ---------- */

export function TuitionCard({ t, role }: { t: TuitionDTO; role: 'teacher' | 'student' }) {
  const p = progress(t);
  return (
    <Link
      href={`/tuitions/${t.id}`}
      className="flex items-center gap-4 rounded-[var(--radius-card)] bg-surface p-4 text-ink no-underline shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
    >
      <Ring value={p} size={60} stroke={7} label={`${t.takenClasses}/${t.plannedClassesPerMonth}`} labelClassName="text-[13px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold">{t.subject}</span>
        <span className="truncate text-[13px] text-muted">{role === 'teacher' ? t.studentName ?? 'No student yet' : `with ${t.teacherName}`}</span>
        <span className="truncate text-xs text-muted">{scheduleText(t)}</span>
      </div>
      <FeeBadge t={t} />
    </Link>
  );
}

export function FeeBadge({ t }: { t: TuitionDTO }) {
  if (t.currentPayment?.paid) return <Badge tone="mint">Paid</Badge>;
  if (t.feeAmount == null) return null;
  return <Badge tone="primary">{formatMoney(t.feeAmount)}</Badge>;
}

/* ---------- Month calendar ---------- */

export function MonthCalendar({
  t,
  classes,
  canEdit,
  onDay,
  large,
}: {
  t: TuitionDTO;
  /** Increment logs of the open month. */
  classes: ClassLogDTO[];
  canEdit: boolean;
  onDay?: (day: string, log?: ClassLogDTO) => void;
  large?: boolean;
}) {
  const today = new Date();
  const [y, m] = (t.currentMonthYear || dateKey(today).slice(0, 7)).split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const nDays = new Date(y, m, 0).getDate();
  const start = cycleStart(t);
  const byDay = new Map<string, ClassLogDTO>();
  for (const c of classes) {
    const d = toDate(c.classDate ?? c.createdAt);
    if (d && !byDay.has(dateKey(d))) byDay.set(dateKey(d), c);
  }
  const done = doneKeys(classes.map((c) => c.classDate ?? c.createdAt));
  const todayKey = dateKey(today);

  const cells: ({ day: number; key: string; kind: 'done' | 'missed' | 'today' | 'planned' | 'plain' } | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let day = 1; day <= nDays; day++) {
    const date = new Date(y, m - 1, day);
    const key = dateKey(date);
    const scheduled = hasSchedule(t) && t.weekdays!.includes(date.getDay());
    let kind: 'done' | 'missed' | 'today' | 'planned' | 'plain' = 'plain';
    if (done.has(key)) kind = 'done';
    else if (key === todayKey) kind = 'today';
    else if (scheduled && date < startOfDay(today) && date >= start) kind = 'missed';
    else if (scheduled && date > startOfDay(today)) kind = 'planned';
    cells.push({ day, key, kind });
  }

  const styles = {
    done: 'bg-primary text-white font-bold',
    missed: 'bg-coral-soft text-coral-ink font-bold',
    today: 'shadow-[inset_0_0_0_2px_var(--color-primary)] text-primary-deep font-extrabold',
    planned: 'bg-ground text-primary-deep font-semibold',
    plain: 'text-muted font-medium',
  } as const;
  const labels = { done: 'Taken', missed: 'Missed', today: 'Today', planned: 'Scheduled', plain: '' } as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted lg:gap-2 lg:text-xs">
        {(large ? WEEKDAY_SHORT : WEEKDAY_LETTER).map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 lg:gap-2">
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} />;
          const future = c.key > todayKey;
          const clickable = canEdit && !!onDay && !future;
          const content = (
            <>
              <span>{c.day}</span>
              {large && c.kind !== 'plain' ? <span className="text-[11px] font-semibold opacity-90">{labels[c.kind]}</span> : null}
            </>
          );
          const cls = cn(
            'rounded-xl text-[13px] lg:text-sm',
            large ? 'flex h-[60px] flex-col justify-between p-2 text-left' : 'grid h-[38px] place-items-center',
            styles[c.kind],
            clickable && 'cursor-pointer transition-transform hover:scale-[1.04]'
          );
          return clickable ? (
            <button
              key={c.key}
              type="button"
              className={cls}
              onClick={() => onDay!(c.key, byDay.get(c.key))}
              aria-label={`${c.day} ${monthLabel(t.currentMonthYear)}: ${labels[c.kind] || 'no class'}`}
            >
              {content}
            </button>
          ) : (
            <span key={c.key} className={cls}>
              {content}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3.5 text-[11px] font-semibold text-muted">
        <Legend className="bg-primary">Taken</Legend>
        {hasSchedule(t) ? (
          <>
            <Legend className="bg-coral-soft shadow-[inset_0_0_0_1px_var(--color-coral-ink)]">Missed</Legend>
            <Legend className="bg-ground shadow-[inset_0_0_0_1px_#9AA3D6]">Scheduled</Legend>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-[3px]', className)} />
      {children}
    </span>
  );
}

/* ---------- Fee card (open month) ---------- */

export function FeeCard({ t, canEdit, className }: { t: TuitionDTO; canEdit: boolean; className?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmUnpaid, setConfirmUnpaid] = useState(false);
  const pay = t.currentPayment;
  const amount = pay?.amount ?? t.feeAmount ?? null;
  const paid = !!pay?.paid;

  const mark = async (value: boolean) => {
    setBusy(true);
    try {
      await setPaid(t.id, 'current', value);
      toast({ message: value ? 'Fee marked as paid' : 'Fee marked as not paid' });
      setConfirmUnpaid(false);
    } catch (e) {
      toast({ message: errorMessage(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn('flex flex-wrap items-center gap-3 px-4 py-3.5', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold">
          {monthLabel(t.currentMonthYear).split(' ')[0]} fee · {formatMoney(amount)}
        </span>
        <span className={cn('text-xs font-semibold', paid ? 'text-mint-ink' : 'text-muted')}>
          {paid ? `Paid ${formatDate(toDate(pay?.paidAt))}` : amount == null ? 'No fee set for this tuition' : 'Not paid yet'}
        </span>
      </div>
      {paid && pay ? (
        <SlipButton tuition={t} monthYear={t.currentMonthYear} taken={t.takenClasses} planned={t.plannedClassesPerMonth} payment={pay} />
      ) : null}
      {canEdit && amount != null ? (
        paid ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirmUnpaid(true)}>
            Undo
          </Button>
        ) : (
          <Button variant="dark" size="sm" onClick={() => mark(true)} loading={busy}>
            {!busy ? <Check className="h-4 w-4" aria-hidden /> : null}
            Mark paid
          </Button>
        )
      ) : null}
      <ConfirmSheet
        open={confirmUnpaid}
        onClose={() => setConfirmUnpaid(false)}
        onConfirm={() => mark(false)}
        loading={busy}
        title="Mark as not paid?"
        confirmLabel="Mark not paid"
        tone="danger"
      >
        The slip number is kept, so if you mark it paid again the same slip is reissued.
      </ConfirmSheet>
    </Card>
  );
}

/* ---------- Create / edit form ---------- */

export type TuitionFormValues = {
  subject: string;
  studentEmail: string;
  studentName: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  plannedClassesPerMonth: number;
  feeAmount: string;
};

export function TuitionForm({
  initial,
  mode,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<TuitionFormValues>;
  mode: 'create' | 'edit';
  onSubmit: (v: TuitionFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const now = new Date();
  const [v, setV] = useState<TuitionFormValues>({
    subject: '',
    studentEmail: '',
    studentName: '',
    weekdays: [],
    startTime: '17:00',
    endTime: '18:30',
    plannedClassesPerMonth: 12,
    feeAmount: '',
    ...initial,
  });
  const [plannedTouched, setPlannedTouched] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkBy, setLinkBy] = useState<'email' | 'name'>('email');

  const set = <K extends keyof TuitionFormValues>(k: K, value: TuitionFormValues[K]) => setV((s) => ({ ...s, [k]: value }));
  const suggestion = v.weekdays.length ? classDaysInMonth(v.weekdays, now.getFullYear(), now.getMonth()) : null;

  const onDays = (days: number[]) => {
    setV((s) => ({
      ...s,
      weekdays: days,
      plannedClassesPerMonth: !plannedTouched && days.length ? classDaysInMonth(days, now.getFullYear(), now.getMonth()) : s.plannedClassesPerMonth,
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!v.subject.trim()) return setError('Add a subject');
    if (mode === 'create' && linkBy === 'email' && !v.studentEmail.trim()) return setError('Add the student’s email, or switch to “Just a name”.');
    if (mode === 'create' && linkBy === 'name' && !v.studentName.trim()) return setError('Add the student’s name');
    if (!v.weekdays.length) return setError('Pick at least one class day');
    if (v.endTime <= v.startTime) return setError('End time must be after start time');
    setBusy(true);
    try {
      await onSubmit({ ...v, studentEmail: linkBy === 'email' ? v.studentEmail : '', studentName: v.studentName });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Subject">
        {(id) => <Input id={id} value={v.subject} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. Physics" autoComplete="off" />}
      </Field>

      {mode === 'create' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-muted">Student</span>
            <div className="flex gap-1 rounded-xl bg-ground p-1 text-xs font-bold">
              {(['email', 'name'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={linkBy === k}
                  onClick={() => setLinkBy(k)}
                  className={cn('rounded-lg px-2.5 py-1.5', linkBy === k ? 'bg-surface text-ink shadow-sm' : 'text-muted')}
                >
                  {k === 'email' ? 'Has an account' : 'Just a name'}
                </button>
              ))}
            </div>
          </div>
          {linkBy === 'email' ? (
            <>
              <Input
                aria-label="Student email"
                type="email"
                inputMode="email"
                value={v.studentEmail}
                onChange={(e) => set('studentEmail', e.target.value)}
                placeholder="student@example.com"
                autoComplete="off"
              />
              <p className="text-xs text-muted">They’ll see classes, homework and fees in their own app.</p>
            </>
          ) : (
            <>
              <Input aria-label="Student name" value={v.studentName} onChange={(e) => set('studentName', e.target.value)} placeholder="Student’s name" />
              <p className="text-xs text-muted">You can link their account later from the tuition page.</p>
            </>
          )}
        </div>
      ) : (
        <Field label="Student name">
          {(id) => <Input id={id} value={v.studentName} onChange={(e) => set('studentName', e.target.value)} />}
        </Field>
      )}

      <WeekdayPicker value={v.weekdays} onChange={onDays} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts">{(id) => <Input id={id} type="time" value={v.startTime} onChange={(e) => set('startTime', e.target.value)} />}</Field>
        <Field label="Ends">{(id) => <Input id={id} type="time" value={v.endTime} onChange={(e) => set('endTime', e.target.value)} />}</Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Classes / month">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={62}
              value={v.plannedClassesPerMonth}
              onChange={(e) => {
                setPlannedTouched(true);
                set('plannedClassesPerMonth', Number(e.target.value));
              }}
            />
          )}
        </Field>
        <Field label="Monthly fee (৳)">
          {(id) => (
            <Input id={id} type="number" inputMode="numeric" min={0} value={v.feeAmount} placeholder="Optional" onChange={(e) => set('feeAmount', e.target.value)} />
          )}
        </Field>
      </div>
      {suggestion ? (
        <p className="-mt-2 text-xs text-muted">
          {v.weekdays.length} {v.weekdays.length === 1 ? 'day' : 'days'} a week gives {suggestion} classes in {monthLabel(dateKey(now).slice(0, 7)).split(' ')[0]}.
        </p>
      ) : null}

      <FormError>{error}</FormError>
      <Button type="submit" size="lg" loading={busy} className="mt-1">
        {submitLabel}
      </Button>
    </form>
  );
}

export function formToPayload(v: TuitionFormValues) {
  return {
    subject: v.subject.trim(),
    studentEmail: v.studentEmail.trim() || undefined,
    studentName: v.studentName.trim() || undefined,
    weekdays: v.weekdays,
    startTime: v.startTime,
    endTime: v.endTime,
    plannedClassesPerMonth: v.plannedClassesPerMonth,
    feeAmount: v.feeAmount === '' ? null : Number(v.feeAmount),
  };
}
