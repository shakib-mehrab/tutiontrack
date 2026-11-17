'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronLeft, Link2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { ReportButton, SlipButton } from '@/components/documents';
import { HomeworkRow, HomeworkSheet } from '@/components/homework';
import { useLogClass } from '@/components/log-class';
import { FeeCard, MonthCalendar, ScheduleChips, TuitionForm, formToPayload, scheduleText } from '@/components/tuition';
import { Badge, Bar, Button, Card, EmptyState, Ring, Skeleton, buttonClass, cn } from '@/components/ui/core';
import { Field, FormError, Input, Segmented } from '@/components/ui/form';
import { ConfirmSheet, Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { errorMessage, send } from '@/lib/client/api';
import { formatClock, formatDate, formatDay, formatMoney, formatTimeRange, initials, monthLabel, monthName, toDate } from '@/lib/client/format';
import { closeMonth, refreshTuitions, removeClass, setPaid, useHomeworkList, useMonths, useTuition } from '@/lib/client/hooks';
import type { ClassLogDTO, MonthRecordDTO, TuitionDTO } from '@/lib/client/types';

type Tab = 'classes' | 'homework' | 'months';

export default function TuitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data, error, isLoading } = useTuition(id);
  const { data: monthsData } = useMonths(id);
  const { data: homework } = useHomeworkList(id);
  const [tab, setTab] = useState<Tab>('classes');
  const [sheet, setSheet] = useState<null | 'more' | 'edit' | 'link' | 'delete' | 'close' | 'homework'>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState title="Tuition not found" action={<Link href="/tuitions" className={buttonClass('outline')}>Back to tuitions</Link>}>
        It may have been deleted, or you don’t have access to it.
      </EmptyState>
    );
  }

  const t = data.tuition;
  const isTeacher = session?.user.id === t.teacherId;
  const classes = data.classDates;
  const months = monthsData?.months ?? [];
  const hw = homework ?? [];
  const openHw = hw.filter((h) => h.status === 'assigned').length;

  return (
    <>
      <PageHeader
        back={
          <Link href="/tuitions" aria-label="Back" className={buttonClass('outline', 'icon', 'border-0 bg-surface')}>
            <ChevronLeft className="h-5 w-5 text-ink" aria-hidden />
          </Link>
        }
        eyebrow={<span className="hidden lg:inline">{scheduleText(t)} · {formatTimeRange(t.startTime, t.endTime)}{t.feeAmount != null ? ` · ${formatMoney(t.feeAmount)} / month` : ''}</span>}
        title={
          <>
            <span className="lg:hidden">{t.subject}</span>
            <span className="hidden lg:inline">
              {t.subject} · {isTeacher ? t.studentName ?? 'No student' : t.teacherName}
            </span>
          </>
        }
        actions={
          isTeacher ? (
            <>
              <div className="hidden gap-2.5 lg:flex">
                <ReportButton tuition={t} classes={classes} />
                <Button variant="outline" onClick={() => setSheet('close')}>
                  Close month
                </Button>
                <LogButton t={t} />
              </div>
              <Button variant="outline" size="icon" className="border-0 bg-surface" aria-label="More options" onClick={() => setSheet('more')}>
                <MoreHorizontal className="h-5 w-5 text-ink" aria-hidden />
              </Button>
            </>
          ) : (
            <div className="hidden lg:flex">
              <ReportButton tuition={t} classes={classes} />
            </div>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        {/* Hero (phone) */}
        <Card className="flex flex-col gap-4 rounded-[var(--radius-panel)] p-[18px] lg:hidden">
          <Hero t={t} isTeacher={isTeacher} />
        </Card>

        <Segmented
          className="lg:hidden"
          label="Tuition sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'classes', label: 'Classes' },
            { value: 'homework', label: openHw ? `Homework · ${openHw}` : 'Homework' },
            { value: 'months', label: 'Months' },
          ]}
        />

        {/* Left column: classes */}
        <div className={cn('flex-col gap-5 lg:row-span-3 lg:flex', tab === 'classes' ? 'flex' : 'hidden')}>
          <CalendarCard t={t} classes={classes} isTeacher={isTeacher} />
          <FeeCard t={t} canEdit={isTeacher} className="lg:hidden" />
          <div className="grid grid-cols-2 gap-2.5 lg:hidden">
            <ReportButton tuition={t} classes={classes} />
            {isTeacher ? (
              <Button onClick={() => setSheet('close')} className="h-11">
                Close month
              </Button>
            ) : null}
          </div>
          <Activity logs={data.logs} isTeacher={isTeacher} t={t} />
        </div>

        {/* Right column (desktop) */}
        <Card className="hidden flex-col gap-3.5 rounded-[var(--radius-panel)] p-5 lg:flex">
          <h2 className="text-base font-extrabold">{isTeacher ? 'Student' : 'Teacher'}</h2>
          <Person t={t} isTeacher={isTeacher} onLink={() => setSheet('link')} />
          <FeeCard t={t} canEdit={isTeacher} className="bg-mist shadow-none" />
        </Card>

        <Card className={cn('flex-col gap-2.5 rounded-[var(--radius-panel)] p-5 lg:flex', tab === 'homework' ? 'flex' : 'hidden')}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold">Homework</h2>
            {isTeacher ? (
              <Button variant="soft" size="sm" onClick={() => setSheet('homework')}>
                <Plus className="h-4 w-4" aria-hidden />
                Assign
              </Button>
            ) : null}
          </div>
          {hw.length === 0 ? <p className="py-2 text-sm text-muted">No homework yet.</p> : hw.slice(0, 6).map((h) => <HomeworkRow key={h.id} h={h} showSubject={false} />)}
          {hw.length > 6 ? (
            <Link href="/homework" className="text-[13px] font-bold no-underline">
              See all {hw.length}
            </Link>
          ) : null}
        </Card>

        <Card className={cn('flex-col gap-1 rounded-[var(--radius-panel)] p-5 lg:flex', tab === 'months' ? 'flex' : 'hidden')}>
          <h2 className="mb-2 text-base font-extrabold">Past months</h2>
          {months.length === 0 ? (
            <p className="py-2 text-sm text-muted">No closed months yet. When a month ends, close it to keep its record and fee status here.</p>
          ) : (
            months.map((m) => <MonthRow key={m.id} m={m} t={t} isTeacher={isTeacher} />)
          )}
        </Card>
      </div>

      {/* Sheets */}
      <Sheet open={sheet === 'more'} onClose={() => setSheet(null)} title={`${t.subject} · ${t.studentName ?? ''}`}>
        <div className="flex flex-col gap-2 pb-4">
          <MenuItem icon={<Pencil className="h-5 w-5" aria-hidden />} onClick={() => setSheet('edit')}>
            Edit tuition
          </MenuItem>
          {!t.studentId ? (
            <MenuItem icon={<Link2 className="h-5 w-5" aria-hidden />} onClick={() => setSheet('link')}>
              Link student account
            </MenuItem>
          ) : null}
          <MenuItem icon={<Trash2 className="h-5 w-5" aria-hidden />} danger onClick={() => setSheet('delete')}>
            Delete tuition
          </MenuItem>
        </div>
      </Sheet>
      {sheet === 'edit' ? <EditSheet t={t} onClose={() => setSheet(null)} /> : null}
      {sheet === 'link' ? <LinkStudentSheet t={t} onClose={() => setSheet(null)} /> : null}
      <DeleteSheet t={t} open={sheet === 'delete'} onClose={() => setSheet(null)} />
      <CloseMonthSheet t={t} open={sheet === 'close'} onClose={() => setSheet(null)} />
      {sheet === 'homework' ? <HomeworkSheet open tuition={t} onClose={() => setSheet(null)} /> : null}
    </>
  );
}

/* ---------- Pieces ---------- */

function LogButton({ t }: { t: TuitionDTO }) {
  const { open } = useLogClass();
  return (
    <Button onClick={() => open(t.id)}>
      <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
      Log class
    </Button>
  );
}

function Hero({ t, isTeacher }: { t: TuitionDTO; isTeacher: boolean }) {
  const left = Math.max(0, t.plannedClassesPerMonth - t.takenClasses);
  return (
    <>
      <div className="flex items-center gap-3.5">
        <Ring value={t.plannedClassesPerMonth ? t.takenClasses / t.plannedClassesPerMonth : 0} size={72} label={`${t.takenClasses}/${t.plannedClassesPerMonth}`} labelClassName="text-[15px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-lg font-extrabold">{isTeacher ? t.studentName ?? 'No student yet' : `with ${t.teacherName}`}</span>
          <span className="text-[13px] text-muted">
            {monthName(t.currentMonthYear)} · {left ? `${left} ${left === 1 ? 'class' : 'classes'} left` : 'all planned classes done'}
          </span>
          {isTeacher ? (
            t.studentId ? (
              <Badge tone="mint" className="self-start">
                Student app linked
              </Badge>
            ) : (
              <Badge tone="neutral" className="self-start">
                No student account
              </Badge>
            )
          ) : null}
        </div>
      </div>
      <ScheduleChips t={t} />
    </>
  );
}

function Person({ t, isTeacher, onLink }: { t: TuitionDTO; isTeacher: boolean; onLink: () => void }) {
  const name = isTeacher ? t.studentName ?? 'No student yet' : t.teacherName;
  return (
    <>
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-[14px] bg-coral-soft text-sm font-extrabold text-coral-ink">
          {initials(name)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{name}</span>
          {isTeacher && t.studentEmail ? <span className="truncate text-xs text-muted">{t.studentEmail}</span> : null}
        </div>
      </div>
      {isTeacher ? (
        t.studentId ? (
          <Badge tone="mint" className="self-start">
            Sees classes, homework and fees in their app
          </Badge>
        ) : (
          <Button variant="soft" size="sm" className="self-start" onClick={onLink}>
            <Link2 className="h-4 w-4" aria-hidden />
            Link student account
          </Button>
        )
      ) : null}
      <div className="border-t border-ground pt-3">
        <ScheduleChips t={t} />
      </div>
    </>
  );
}

function CalendarCard({ t, classes, isTeacher }: { t: TuitionDTO; classes: ClassLogDTO[]; isTeacher: boolean }) {
  const { open } = useLogClass();
  const toast = useToast();
  const [removing, setRemoving] = useState<{ day: string; log: ClassLogDTO } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="flex flex-col gap-3 rounded-[var(--radius-panel)] p-4 lg:gap-4 lg:p-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold lg:text-lg">{monthLabel(t.currentMonthYear)}</h2>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="text-sm font-bold">
            {t.takenClasses} of {t.plannedClassesPerMonth} classes
          </span>
          <Bar value={t.plannedClassesPerMonth ? t.takenClasses / t.plannedClassesPerMonth : 0} className="h-2 w-40" track="bg-primary-soft" />
        </div>
        {isTeacher ? <span className="text-xs font-semibold text-muted lg:hidden">Tap a day to log or remove</span> : null}
      </div>
      <div className="lg:hidden">
        <MonthCalendar t={t} classes={classes} canEdit={isTeacher} onDay={(day, log) => (log ? setRemoving({ day, log }) : open(t.id, day))} />
      </div>
      <div className="hidden lg:block">
        <MonthCalendar large t={t} classes={classes} canEdit={isTeacher} onDay={(day, log) => (log ? setRemoving({ day, log }) : open(t.id, day))} />
      </div>
      <ConfirmSheet
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove this class?"
        confirmLabel="Remove class"
        tone="danger"
        loading={busy}
        onConfirm={async () => {
          if (!removing) return;
          setBusy(true);
          try {
            await removeClass(t.id, removing.log.id);
            toast({ message: 'Class removed' });
            setRemoving(null);
          } catch (e) {
            toast({ message: errorMessage(e), tone: 'error' });
          } finally {
            setBusy(false);
          }
        }}
      >
        The class on {removing ? formatDay(toDate(removing.day + 'T12:00:00')) : ''} will be removed and this month’s count goes down by one.
      </ConfirmSheet>
    </Card>
  );
}

function Activity({ logs, isTeacher, t }: { logs: ClassLogDTO[]; isTeacher: boolean; t: TuitionDTO }) {
  const toast = useToast();
  const items = logs.filter((l) => l.actionType === 'increment').slice(0, 12);
  return (
    <Card className="flex flex-col rounded-[var(--radius-panel)] p-4 lg:p-[22px]">
      <h2 className="mb-2 text-[15px] font-extrabold lg:text-lg">Activity</h2>
      {items.length === 0 ? <p className="py-2 text-sm text-muted">No classes logged this month yet.</p> : null}
      {items.map((l, i) => {
        const day = toDate(l.classDate ?? l.createdAt);
        const at = toDate(l.createdAt);
        const note = (l as ClassLogDTO & { description?: string }).description;
        return (
          <div key={l.id} className={cn('flex items-center gap-3.5 py-3', i < items.length - 1 && 'border-b border-ground')}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-deep">
              <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">Class on {formatDay(day)}</span>
              <span className="truncate text-xs text-muted">
                {note ? `${note} · ` : ''}Logged by {l.addedByName} · {formatDate(at)}, {formatClock(at)}
              </span>
            </div>
            {isTeacher ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove class on ${formatDay(day)}`}
                onClick={async () => {
                  try {
                    await removeClass(t.id, l.id);
                    toast({ message: 'Class removed' });
                  } catch (e) {
                    toast({ message: errorMessage(e), tone: 'error' });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        );
      })}
    </Card>
  );
}

function MonthRow({ m, t, isTeacher }: { m: MonthRecordDTO; t: TuitionDTO; isTeacher: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pay = m.payment;
  const amount = pay?.amount ?? null;
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-ground py-3 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold">{monthLabel(m.monthYear)}</span>
        <span className="text-xs text-muted">
          {m.takenClasses} of {m.plannedClasses} classes{amount != null ? ` · ${formatMoney(amount)}` : ''}
        </span>
      </div>
      {pay?.paid ? <Badge tone="mint">Paid</Badge> : amount != null ? <Badge tone="coral">Due</Badge> : null}
      {pay?.paid ? <SlipButton tuition={t} monthYear={m.monthYear} taken={m.takenClasses} planned={m.plannedClasses} payment={pay} /> : null}
      {isTeacher && !pay?.paid && amount != null ? (
        <Button
          variant="dark"
          size="sm"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await setPaid(t.id, m.id, true);
              toast({ message: `${monthName(m.monthYear)} fee marked as paid` });
            } catch (e) {
              toast({ message: errorMessage(e), tone: 'error' });
            } finally {
              setBusy(false);
            }
          }}
        >
          Mark paid
        </Button>
      ) : null}
      <ReportButton tuition={t} record={m} iconOnly />
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 items-center gap-3.5 rounded-2xl px-4 text-left text-[15px] font-bold transition-colors',
        danger ? 'bg-coral-mist text-coral-ink hover:bg-coral-soft' : 'bg-mist text-ink hover:bg-line-soft/60'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function EditSheet({ t, onClose }: { t: TuitionDTO; onClose: () => void }) {
  const toast = useToast();
  return (
    <Sheet open onClose={onClose} title="Edit tuition" size="lg">
      <div className="pb-4">
        <TuitionForm
          mode="edit"
          submitLabel="Save changes"
          initial={{
            subject: t.subject,
            studentName: t.studentName ?? '',
            weekdays: t.weekdays ?? [],
            startTime: t.startTime,
            endTime: t.endTime,
            plannedClassesPerMonth: t.plannedClassesPerMonth,
            feeAmount: t.feeAmount == null ? '' : String(t.feeAmount),
          }}
          onSubmit={async (v) => {
            const p = formToPayload(v);
            await send(`/api/tuitions/${t.id}`, 'PATCH', {
              subject: p.subject,
              studentName: p.studentName,
              weekdays: p.weekdays,
              startTime: p.startTime,
              endTime: p.endTime,
              plannedClassesPerMonth: p.plannedClassesPerMonth,
              feeAmount: p.feeAmount,
            });
            await refreshTuitions();
            toast({ message: 'Tuition updated' });
            onClose();
          }}
        />
      </div>
    </Sheet>
  );
}

function LinkStudentSheet({ t, onClose }: { t: TuitionDTO; onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet
      open
      onClose={onClose}
      title="Link student account"
      description="The student must have signed up as a student. They’ll then see this tuition in their app."
      footer={
        <Button
          size="lg"
          loading={busy}
          onClick={async () => {
            setError(null);
            setBusy(true);
            try {
              await send(`/api/tuitions/${t.id}/student`, 'PATCH', { studentEmail: email.trim() });
              await refreshTuitions();
              toast({ message: 'Student linked' });
              onClose();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Link student
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <Field label="Student email">
          {(id) => <Input id={id} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" />}
        </Field>
        <FormError>{error}</FormError>
      </div>
    </Sheet>
  );
}

function DeleteSheet({ t, open, onClose }: { t: TuitionDTO; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title="Delete this tuition?"
      confirmLabel="Delete forever"
      tone="danger"
      loading={busy}
      onConfirm={async () => {
        setBusy(true);
        try {
          await send(`/api/tuitions/${t.id}`, 'DELETE');
          await refreshTuitions();
          toast({ message: 'Tuition deleted' });
          router.replace('/tuitions');
        } catch (e) {
          toast({ message: errorMessage(e), tone: 'error' });
          setBusy(false);
        }
      }}
    >
      {t.subject} with {t.studentName ?? 'this student'} will be deleted with all its classes, past months, payment records and homework. This can’t be undone.
    </ConfirmSheet>
  );
}

function CloseMonthSheet({ t, open, onClose }: { t: TuitionDTO; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const paid = t.currentPayment?.paid;
  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={`Close ${monthName(t.currentMonthYear)}?`}
      confirmLabel="Close month"
      loading={busy}
      onConfirm={async () => {
        setBusy(true);
        try {
          await closeMonth(t.id);
          toast({ message: `${monthName(t.currentMonthYear)} closed. A new month has started.` });
          onClose();
        } catch (e) {
          toast({ message: errorMessage(e), tone: 'error' });
        } finally {
          setBusy(false);
        }
      }}
    >
      {monthLabel(t.currentMonthYear)} will be saved with {t.takenClasses} of {t.plannedClassesPerMonth} classes
      {t.feeAmount != null ? ` and its fee marked ${paid ? 'paid' : 'not paid yet'}` : ''}. You’ll find it under Months. The new month starts at 0.
    </ConfirmSheet>
  );
}
