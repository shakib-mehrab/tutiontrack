'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { Button, cn } from '@/components/ui/core';
import { Chips, Field, Input } from '@/components/ui/form';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/client/api';
import { addDays, dateKey, formatDay, formatTime, toDate } from '@/lib/client/format';
import { logClass, removeClass, useTuitions } from '@/lib/client/hooks';
import { doneKeys, isClassDay } from '@/lib/client/schedule';

type Ctx = {
  /** Open the sheet, optionally preselecting a tuition and a day ("YYYY-MM-DD"). */
  open: (tuitionId?: string, day?: string) => void;
  /** Log a class right away (no sheet), with an Undo toast. */
  quickLog: (tuitionId: string, day?: string) => Promise<void>;
};

const LogClassContext = createContext<Ctx>({ open: () => {}, quickLog: async () => {} });

export function useLogClass() {
  return useContext(LogClassContext);
}

export function LogClassProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const toast = useToast();
  const [state, setState] = useState<{ open: boolean; tuitionId?: string; day?: string }>({ open: false });

  const doLog = useCallback(
    async (tuitionId: string, day: string, label: string, note?: string) => {
      const res = await logClass(tuitionId, day, note);
      const logId = res.logId;
      toast({
        message: `Class logged · ${label}`,
        action: logId
          ? {
              label: 'Undo',
              onClick: () => {
                removeClass(tuitionId, logId)
                  .then(() => toast({ message: 'Class removed' }))
                  .catch((e) => toast({ message: errorMessage(e), tone: 'error' }));
              },
            }
          : undefined,
      });
    },
    [toast]
  );

  const quickLog = useCallback(
    async (tuitionId: string, day?: string) => {
      try {
        await doLog(tuitionId, day ?? dateKey(new Date()), 'today');
      } catch (e) {
        toast({ message: errorMessage(e), tone: 'error' });
      }
    },
    [doLog, toast]
  );

  const value = useMemo<Ctx>(
    () => ({
      open: (tuitionId, day) => enabled && setState({ open: true, tuitionId, day }),
      quickLog,
    }),
    [enabled, quickLog]
  );

  return (
    <LogClassContext.Provider value={value}>
      {children}
      {enabled && state.open ? (
        <LogClassSheet
          initialTuition={state.tuitionId}
          initialDay={state.day}
          onClose={() => setState({ open: false })}
          onLog={doLog}
        />
      ) : null}
    </LogClassContext.Provider>
  );
}

function LogClassSheet({
  initialTuition,
  initialDay,
  onClose,
  onLog,
}: {
  initialTuition?: string;
  initialDay?: string;
  onClose: () => void;
  onLog: (tuitionId: string, day: string, label: string, note?: string) => Promise<void>;
}) {
  const { data } = useTuitions();
  const toast = useToast();
  const today = new Date();
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(addDays(today, -1));

  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState<'today' | 'yesterday' | 'pick'>(
    !initialDay || initialDay === todayKey ? 'today' : initialDay === yesterdayKey ? 'yesterday' : 'pick'
  );
  const [picked, setPicked] = useState(initialDay ?? todayKey);
  const day = when === 'today' ? todayKey : when === 'yesterday' ? yesterdayKey : picked;

  // Scheduled-today tuitions first, by start time.
  const tuitions = useMemo(() => {
    const list = [...(data?.tuitions ?? [])];
    list.sort((a, b) => {
      const sa = isClassDay(a, today) ? 0 : 1;
      const sb = isClassDay(b, today) ? 0 : 1;
      return sa - sb || a.startTime.localeCompare(b.startTime);
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const [selected, setSelected] = useState<string | undefined>(initialTuition);
  const selectedId = selected ?? tuitions[0]?.id;
  const chosen = tuitions.find((t) => t.id === selectedId);
  const firstThree = showAll || tuitions.length <= 3 ? tuitions : tuitions.slice(0, 3);
  // Keep a preselected tuition visible even when it isn't in the first three.
  const visible = chosen && !firstThree.includes(chosen) ? [...firstThree, chosen] : firstThree;
  const alreadyLogged = chosen ? doneKeys(data?.classDates[chosen.id]).has(day) : false;

  const submit = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      await onLog(chosen.id, day, chosen.subject, note);
      onClose();
    } catch (e) {
      toast({ message: errorMessage(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Log a class"
      footer={
        <>
          <Button size="lg" onClick={submit} loading={busy} disabled={!chosen || !day}>
            {!busy ? <Check className="h-5 w-5" aria-hidden /> : null}
            {chosen ? `Log class · ${chosen.subject}` : 'Log class'}
          </Button>
          <p className="text-center text-xs text-muted">You can undo for 10 seconds after logging.</p>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[13px] font-bold text-muted">Which tuition?</legend>
          {tuitions.length === 0 ? <p className="text-sm text-muted">You have no tuitions yet.</p> : null}
          {visible.map((t) => {
            const on = t.id === selectedId;
            const scheduledToday = isClassDay(t, today);
            return (
              <label
                key={t.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 transition-colors',
                  on ? 'bg-primary-soft outline-2 outline-primary' : 'bg-mist hover:bg-line-soft/60'
                )}
              >
                <input
                  type="radio"
                  name="tuition"
                  checked={on}
                  onChange={() => setSelected(t.id)}
                  className="m-0 h-5 w-5 accent-[var(--color-primary)]"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold">
                    {t.subject} · {t.studentName ?? 'Student'}
                  </span>
                  <span className={cn('text-xs', scheduledToday ? 'font-semibold text-primary-deep' : 'text-muted')}>
                    {scheduledToday ? `Today · ${formatTime(t.startTime)}` : 'Not scheduled today'}
                  </span>
                </span>
                <span className={cn('text-[13px] font-bold', on ? 'text-primary-deep' : 'text-muted')}>
                  {t.takenClasses}/{t.plannedClassesPerMonth}
                </span>
              </label>
            );
          })}
          {!showAll && tuitions.length > 3 ? (
            <button type="button" onClick={() => setShowAll(true)} className="self-start py-1 text-[13px] font-bold text-primary">
              Show all {tuitions.length} tuitions
            </button>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-bold text-muted">When?</span>
          <Chips
            label="When was the class"
            value={when}
            onChange={setWhen}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              {
                value: 'pick',
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    {when === 'pick' ? formatDay(toDate(picked + 'T12:00:00')) : 'Pick a date'}
                  </span>
                ),
              },
            ]}
          />
          {when === 'pick' ? (
            <Input type="date" aria-label="Class date" value={picked} max={todayKey} onChange={(e) => setPicked(e.target.value)} />
          ) : null}
          {alreadyLogged ? (
            <p className="rounded-xl bg-coral-mist px-3 py-2 text-xs font-semibold text-coral-ink">
              A class is already logged on this day. Logging again counts it twice.
            </p>
          ) : null}
        </div>

        <Field label="Note (optional)">
          {(id) => (
            <Input id={id} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Covered chapter 4, numericals" />
          )}
        </Field>
      </div>
    </Sheet>
  );
}
