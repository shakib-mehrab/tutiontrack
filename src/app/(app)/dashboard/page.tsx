'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { AlertCircle, BookOpen, CalendarPlus, Check, ChevronRight, CreditCard, Plus } from 'lucide-react';
import { PageHeader, ProfileLink } from '@/components/app-shell';
import { useLogClass } from '@/components/log-class';
import { InstallCard } from '@/components/pwa';
import { FeeBadge, TuitionCard, scheduleText } from '@/components/tuition';
import { Badge, Bar, Button, ButtonLink, Card, EmptyState, Ring, SectionTitle, Skeleton, Tile, cn } from '@/components/ui/core';
import {
  WEEKDAY_LETTER,
  addDays,
  dateKey,
  dueLabel,
  firstName,
  formatDay,
  formatLongDay,
  formatMoney,
  formatTime,
  formatTimeRange,
  monthName,
  startOfDay,
  subjectTag,
  toDate,
} from '@/lib/client/format';
import { useHomeworkList, usePayments, useTuitions } from '@/lib/client/hooks';
import { doneKeys, isClassDay, missedDays, nextClass } from '@/lib/client/schedule';
import type { TuitionDTO } from '@/lib/client/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  if (!session?.user) return <DashboardSkeleton />;
  return session.user.role === 'teacher' ? <TeacherToday name={session.user.name ?? ''} /> : <StudentHome name={session.user.name ?? ''} />;
}

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-32" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );
}

/* ================================================================== */
/* Teacher                                                             */
/* ================================================================== */

function TeacherToday({ name }: { name: string }) {
  const { data, isLoading } = useTuitions();
  const { data: payments } = usePayments();
  const { data: homework } = useHomeworkList();
  const { open, quickLog } = useLogClass();
  const today = new Date();
  const todayKey = dateKey(today);

  const tuitions = useMemo(() => data?.tuitions ?? [], [data]);
  const classDates = data?.classDates ?? {};

  const todays = tuitions
    .filter((t) => isClassDay(t, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((t) => ({ t, done: doneKeys(classDates[t.id]).has(todayKey) }));
  const nextIdx = todays.findIndex((x) => !x.done);
  const doneCount = todays.filter((x) => x.done).length;

  const taken = tuitions.reduce((s, t) => s + (t.takenClasses || 0), 0);
  const planned = tuitions.reduce((s, t) => s + (t.plannedClassesPerMonth || 0), 0);

  const unpaid = (payments?.items ?? []).flatMap(({ tuition, months }) =>
    months.filter((m) => !m.payment?.paid && (m.payment?.amount ?? null) !== null).map((m) => ({ tuition, m }))
  );
  const dueTotal = unpaid.reduce((s, x) => s + (x.m.payment?.amount ?? 0), 0);
  const missed = tuitions.flatMap((t) => missedDays(t, doneKeys(classDates[t.id]), today).map((d) => ({ t, d }))).slice(-4).reverse();
  const toReview = (homework ?? []).filter((h) => h.status === 'assigned');
  const noSchedule = tuitions.filter((t) => !t.weekdays?.length);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow={formatLongDay(today)}
        title={
          <>
            <span className="lg:hidden">Hi, {firstName(name)}</span>
            <span className="hidden lg:inline">
              {greeting(today)}, {firstName(name)}
            </span>
          </>
        }
        actions={
          <>
          <ProfileLink name={name} />
          <div className="hidden gap-2.5 lg:flex">
            <ButtonLink href="/tuitions/new" variant="outline">
              <Plus className="h-[18px] w-[18px]" aria-hidden />
              New tuition
            </ButtonLink>
            <Button onClick={() => open()}>
              <Check className="h-[18px] w-[18px]" aria-hidden />
              Log class
            </Button>
          </div>
          </>
        }
      />

      {tuitions.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus className="h-7 w-7" aria-hidden />}
          title="Add your first tuition"
          action={
            <ButtonLink href="/tuitions/new" size="lg">
              <Plus className="h-5 w-5" aria-hidden />
              New tuition
            </ButtonLink>
          }
        >
          Pick the class days, time and fee. Your classes for each day will show up here.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-7 xl:flex-row">
          <div className="flex min-w-0 flex-[3] flex-col gap-6">
            {/* Month summary: one big card on phones, four tiles on desktop */}
            <div className="flex items-center gap-[18px] rounded-3xl bg-primary p-5 text-white shadow-[0_14px_30px_rgba(84,104,240,0.3)] lg:hidden">
              <Ring
                value={planned ? taken / planned : 0}
                size={84}
                stroke={9}
                track="rgba(255,255,255,0.25)"
                color="#fff"
                label={`${planned ? Math.round((taken / planned) * 100) : 0}%`}
                labelClassName="text-lg"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-primary-soft">{monthName(dateKey(today).slice(0, 7))} so far</span>
                <span className="text-[22px] font-extrabold tracking-tight">
                  {taken} of {planned} classes
                </span>
                <span className="text-[13px] font-medium text-primary-soft">
                  across {tuitions.length} {tuitions.length === 1 ? 'tuition' : 'tuitions'}
                  {unpaid.length ? ` · ${unpaid.length} ${unpaid.length === 1 ? 'fee' : 'fees'} due` : ''}
                </span>
              </div>
            </div>

            <div className="hidden grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5 lg:grid">
              <div className="flex flex-col gap-1.5 rounded-[var(--radius-card)] bg-primary p-[18px] text-white">
                <span className="text-[13px] font-semibold text-primary-soft">Classes in {monthName(dateKey(today).slice(0, 7))}</span>
                <span className="text-[26px] font-extrabold">
                  {taken} / {planned}
                </span>
                <Bar value={planned ? taken / planned : 0} track="bg-white/25" fill="bg-white" />
              </div>
              <StatTile label="Today" value={todays.length ? `${doneCount} of ${todays.length} done` : 'No classes'}>
                {nextIdx >= 0 ? `Next at ${formatTime(todays[nextIdx].t.startTime)}` : todays.length ? 'All done' : 'Enjoy the day'}
              </StatTile>
              <StatTile label="Fees due" value={formatMoney(dueTotal)} coral={dueTotal > 0}>
                {unpaid.length ? `${unpaid.length} ${unpaid.length === 1 ? 'month' : 'months'} unpaid` : 'All settled'}
              </StatTile>
              <StatTile label="Homework open" value={String(toReview.length)}>
                {toReview.length ? 'Not completed yet' : 'Nothing pending'}
              </StatTile>
            </div>

            {/* Today's classes */}
            <section className="flex flex-col gap-3">
              <SectionTitle action={todays.length ? <span className="text-[13px] font-semibold text-muted">{doneCount} of {todays.length} done</span> : null}>
                Today’s classes
              </SectionTitle>
              {todays.length === 0 ? (
                <Card className="p-5 text-sm text-muted">
                  No classes scheduled today.{' '}
                  <button type="button" className="font-bold text-primary" onClick={() => open()}>
                    Log a make-up class
                  </button>
                </Card>
              ) : (
                todays.map(({ t, done }, i) => (
                  <TodayRow key={t.id} t={t} done={done} next={i === nextIdx} onDone={() => quickLog(t.id, todayKey)} />
                ))
              )}
              {noSchedule.length ? (
                <p className="text-xs text-muted">
                  {noSchedule.length} {noSchedule.length === 1 ? 'tuition has' : 'tuitions have'} no class days set, so {noSchedule.length === 1 ? 'it doesn’t' : 'they don’t'} show here.{' '}
                  <Link href={`/tuitions/${noSchedule[0].id}`} className="font-bold">
                    Set class days
                  </Link>
                </p>
              ) : null}
            </section>

            <section className="hidden flex-col gap-3.5 lg:flex">
              <SectionTitle action={<Link href="/tuitions" className="text-[13px] font-bold no-underline">See all</Link>}>All tuitions</SectionTitle>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
                {tuitions.slice(0, 6).map((t) => (
                  <TuitionCard key={t.id} t={t} role="teacher" />
                ))}
              </div>
            </section>
          </div>

          <aside className="flex min-w-0 flex-col gap-5 xl:w-[320px] xl:flex-none">
            <WeekStrip tuitions={tuitions} />
            {unpaid.length || missed.length ? (
              <section className="flex flex-col gap-3">
                <SectionTitle>Needs attention</SectionTitle>
                {unpaid.slice(0, 3).map(({ tuition, m }) => (
                  <Link
                    key={tuition.id + m.id}
                    href="/payments"
                    className="flex items-center gap-3.5 rounded-[var(--radius-card)] bg-surface p-4 text-ink no-underline shadow-[var(--shadow-card)]"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-coral-soft text-coral-ink">
                      <CreditCard className="h-[22px] w-[22px]" aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-bold">
                        {monthName(m.monthYear)} fee · {tuition.studentName ?? tuition.subject}
                      </span>
                      <span className="text-[13px] font-semibold text-coral-ink">{formatMoney(m.payment?.amount)} due</span>
                    </div>
                    <ChevronRight className="h-[18px] w-[18px] text-muted" aria-hidden />
                  </Link>
                ))}
                {missed.map(({ t, d }) => (
                  <Card key={t.id + dateKey(d)} className="flex items-center gap-3.5 p-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-mist text-muted">
                      <AlertCircle className="h-[22px] w-[22px]" aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-bold">Missed · {t.subject}</span>
                      <span className="text-[13px] text-muted">{formatDay(d)} was scheduled, not logged</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => open(t.id, dateKey(d))}>
                      Log it
                    </Button>
                  </Card>
                ))}
              </section>
            ) : null}
            <InstallCard />
          </aside>
        </div>
      )}
    </>
  );
}

function StatTile({ label, value, children, coral }: { label: string; value: string; children?: React.ReactNode; coral?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5 rounded-[var(--radius-card)] p-[18px]', coral ? 'bg-coral-soft' : 'bg-surface shadow-[var(--shadow-card)]')}>
      <span className={cn('text-[13px] font-semibold', coral ? 'font-bold text-coral-ink' : 'text-muted')}>{label}</span>
      <span className="text-[26px] font-extrabold">{value}</span>
      <span className={cn('text-xs', coral ? 'font-semibold text-coral-ink' : 'text-muted')}>{children}</span>
    </div>
  );
}

function TodayRow({ t, done, next, onDone }: { t: TuitionDTO; done: boolean; next: boolean; onDone: () => void }) {
  const meta = `${formatTimeRange(t.startTime, t.endTime)} · ${t.takenClasses} of ${t.plannedClassesPerMonth} this month`;
  if (done) {
    return (
      <Card className="flex items-center gap-3.5 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-mint-soft text-mint-ink">
          <Check className="h-[22px] w-[22px]" strokeWidth={2.6} aria-hidden />
        </div>
        <Link href={`/tuitions/${t.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 text-ink no-underline">
          <span className="truncate text-[15px] font-bold">
            {t.subject} · {t.studentName ?? 'Student'}
          </span>
          <span className="truncate text-[13px] text-muted">{meta}</span>
        </Link>
        <Badge tone="mint" className="px-3 py-1.5 text-xs">
          Done
        </Badge>
      </Card>
    );
  }
  if (next) {
    return (
      <Card className="flex flex-col gap-3.5 p-4 outline-2 outline-primary-line">
        <div className="flex items-center gap-3.5">
          <Tile text={subjectTag(t.subject)} seed={t.subject} />
          <Link href={`/tuitions/${t.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 text-ink no-underline">
            <span className="truncate text-[15px] font-bold">
              {t.subject} · {t.studentName ?? 'Student'}
            </span>
            <span className="truncate text-[13px] text-muted">{meta}</span>
          </Link>
          <Badge className="px-3 py-1.5 text-xs">Next</Badge>
        </div>
        <Bar value={t.plannedClassesPerMonth ? t.takenClasses / t.plannedClassesPerMonth : 0} />
        <Button size="md" className="h-12" onClick={onDone}>
          <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
          Mark class done
        </Button>
      </Card>
    );
  }
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <Tile text={subjectTag(t.subject)} seed={t.subject} />
      <Link href={`/tuitions/${t.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5 text-ink no-underline">
        <span className="truncate text-[15px] font-bold">
          {t.subject} · {t.studentName ?? 'Student'}
        </span>
        <span className="truncate text-[13px] text-muted">{meta}</span>
      </Link>
      <Button variant="outline" size="icon" aria-label={`Mark ${t.subject} class done`} onClick={onDone}>
        <Check className="h-[18px] w-[18px] text-primary" strokeWidth={2.6} aria-hidden />
      </Button>
    </Card>
  );
}

function WeekStrip({ tuitions }: { tuitions: TuitionDTO[] }) {
  const today = startOfDay(new Date());
  const sunday = addDays(today, -today.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
  return (
    <Card className="hidden flex-col gap-3.5 p-[18px] lg:flex">
      <h2 className="text-base font-extrabold">This week</h2>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((d) => {
          const count = tuitions.filter((t) => isClassDay(t, d)).length;
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={d.toISOString()} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted">{WEEKDAY_LETTER[d.getDay()]}</span>
              <span
                className={cn(
                  'grid h-[34px] w-[34px] place-items-center rounded-[11px] text-[13px]',
                  isToday ? 'bg-primary font-extrabold text-white' : 'bg-mist font-bold'
                )}
              >
                {d.getDate()}
              </span>
              <span className="text-[11px] font-bold text-primary-deep">{count || '–'}</span>
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted">Numbers show classes scheduled that day.</span>
    </Card>
  );
}

/* ================================================================== */
/* Student                                                             */
/* ================================================================== */

function StudentHome({ name }: { name: string }) {
  const { data, isLoading } = useTuitions();
  const { data: homework } = useHomeworkList();
  const tuitions = data?.tuitions ?? [];
  const now = new Date();

  const upcoming = tuitions
    .map((t) => ({ t, at: nextClass(t, now) }))
    .filter((x): x is { t: TuitionDTO; at: Date } => !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

  const due = (homework ?? [])
    .filter((h) => h.status === 'assigned')
    .sort((a, b) => (toDate(a.dueDate)?.getTime() ?? 0) - (toDate(b.dueDate)?.getTime() ?? 0))
    .slice(0, 4);

  if (isLoading) return <DashboardSkeleton />;

  const when = upcoming
    ? dateKey(upcoming.at) === dateKey(now)
      ? 'Today'
      : dateKey(upcoming.at) === dateKey(addDays(now, 1))
        ? 'Tomorrow'
        : formatDay(upcoming.at)
    : '';

  return (
    <>
      <PageHeader eyebrow={formatLongDay(now)} title={`Hi, ${firstName(name)}`} actions={<ProfileLink name={name} />} />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-[3] flex-col gap-6">
          {upcoming ? (
            <Link href={`/tuitions/${upcoming.t.id}`} className="flex flex-col gap-3.5 rounded-3xl bg-ink p-5 text-white no-underline">
              <span className="text-xs font-bold tracking-[0.06em] text-primary-line uppercase">Next class</span>
              <div className="flex items-center gap-3.5">
                <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-primary text-[13px] font-extrabold">{subjectTag(upcoming.t.subject)}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-extrabold">
                    {upcoming.t.subject} with {firstName(upcoming.t.teacherName)}
                  </span>
                  <span className="text-[13px] text-primary-line">
                    {when} · {formatTimeRange(upcoming.t.startTime, upcoming.t.endTime)}
                  </span>
                </div>
              </div>
            </Link>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionTitle>My tuitions</SectionTitle>
            {tuitions.length === 0 ? (
              <EmptyState icon={<BookOpen className="h-7 w-7" aria-hidden />} title="No tuitions yet">
                When your teacher adds you with your email, your classes show up here.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                {tuitions.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tuitions/${t.id}`}
                    className="flex flex-col gap-2.5 rounded-[var(--radius-card)] bg-surface p-4 text-ink no-underline shadow-[var(--shadow-card)]"
                  >
                    <Ring value={t.plannedClassesPerMonth ? t.takenClasses / t.plannedClassesPerMonth : 0} size={60} stroke={7} label={`${t.takenClasses}/${t.plannedClassesPerMonth}`} labelClassName="text-[13px]" />
                    <span className="text-[15px] font-extrabold">{t.subject}</span>
                    <span className="text-xs text-muted">{scheduleText(t)}</span>
                    <FeeBadge t={t} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-3 xl:w-[340px] xl:flex-none">
          <SectionTitle action={<Link href="/homework" className="text-[13px] font-bold no-underline">See all</Link>}>Homework due</SectionTitle>
          {due.length === 0 ? (
            <Card className="p-5 text-sm text-muted">Nothing due. Nice!</Card>
          ) : (
            <Card className="divide-y divide-ground">
              {due.map((h) => {
                const dl = dueLabel(toDate(h.dueDate));
                return (
                  <Link key={h.id} href={`/homework/${h.id}`} className="flex items-center gap-3 px-4 py-3.5 text-ink no-underline">
                    <span aria-hidden className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dl.overdue || dl.soon ? 'bg-coral-strong' : 'bg-[#9AA3D6]')} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-bold">
                        {h.chapter} · {h.topic}
                      </span>
                      <span className={cn('text-xs', dl.overdue || dl.soon ? 'font-semibold text-coral-ink' : 'text-muted')}>
                        {h.subject} · {dl.text.toLowerCase()}
                      </span>
                    </span>
                    <ChevronRight className="h-[18px] w-[18px] text-muted" aria-hidden />
                  </Link>
                );
              })}
            </Card>
          )}
          <InstallCard />
        </aside>
      </div>
    </>
  );
}
