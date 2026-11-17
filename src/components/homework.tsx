'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge, Button, cn } from '@/components/ui/core';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/form';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { errorMessage, send } from '@/lib/client/api';
import { addDays, dateKey, dueLabel, formatDate, noonISO, toDate } from '@/lib/client/format';
import { refreshHomework } from '@/lib/client/hooks';
import type { HomeworkDTO, TuitionDTO } from '@/lib/client/types';

export function HomeworkRow({ h, showSubject = true, className }: { h: HomeworkDTO; showSubject?: boolean; className?: string }) {
  const completed = h.status === 'completed';
  const dl = dueLabel(toDate(h.dueDate));
  const urgent = !completed && (dl.overdue || dl.soon);
  return (
    <Link
      href={`/homework/${h.id}`}
      className={cn('flex items-center gap-3 rounded-2xl p-3 text-ink no-underline transition-colors', urgent ? 'bg-coral-mist hover:bg-coral-soft/70' : 'bg-mist hover:bg-line-soft/60', className)}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold">
          {h.chapter} · {h.topic}
        </span>
        <span className={cn('truncate text-xs', completed ? 'font-semibold text-mint-ink' : urgent ? 'font-semibold text-coral-ink' : 'text-muted')}>
          {showSubject ? `${h.subject} · ` : ''}
          {completed ? `Completed ${formatDate(toDate(h.completedAt))}` : dl.text}
        </span>
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

export function HomeworkStatus({ h }: { h: HomeworkDTO }) {
  if (h.status === 'completed') return <Badge tone="mint">Completed</Badge>;
  const dl = dueLabel(toDate(h.dueDate));
  return <Badge tone={dl.overdue || dl.soon ? 'coral' : 'primary'}>{dl.text}</Badge>;
}

/** Assign (or edit) homework. Pass `tuitions` to let the teacher pick, or `tuition` to fix it. */
export function HomeworkSheet({
  open,
  onClose,
  tuitions,
  tuition,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  tuitions?: TuitionDTO[];
  tuition?: TuitionDTO;
  editing?: HomeworkDTO;
  onSaved?: (h: HomeworkDTO) => void;
}) {
  const toast = useToast();
  const linkable = (tuitions ?? []).filter((t) => t.studentId);
  const [tuitionId, setTuitionId] = useState(editing?.tuitionId ?? tuition?.id ?? linkable[0]?.id ?? '');
  const chosen = tuition ?? linkable.find((t) => t.id === tuitionId);
  const [chapter, setChapter] = useState(editing?.chapter ?? '');
  const [topic, setTopic] = useState(editing?.topic ?? '');
  const [due, setDue] = useState(editing ? dateKey(toDate(editing.dueDate) ?? new Date()) : dateKey(addDays(new Date(), 2)));
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const noStudent = !editing && chosen && !chosen.studentId;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!chosen && !editing) return setError('Pick a tuition');
    if (!chapter.trim() || !topic.trim()) return setError('Add a chapter and a topic');
    setBusy(true);
    try {
      const payload = { chapter: chapter.trim(), topic: topic.trim(), dueDate: noonISO(due), notes: notes.trim() };
      const saved = editing
        ? await send<HomeworkDTO>(`/api/homework/${editing.id}`, 'PUT', payload)
        : await send<HomeworkDTO>('/api/homework', 'POST', { ...payload, tuitionId: chosen!.id, subject: chosen!.subject });
      await refreshHomework();
      toast({ message: editing ? 'Homework updated' : 'Homework assigned' });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit homework' : 'Assign homework'} description={chosen ? `${chosen.subject} · ${chosen.studentName ?? ''}` : undefined}>
      <form onSubmit={submit} className="flex flex-col gap-4 pb-4" noValidate>
        {!tuition && !editing ? (
          linkable.length ? (
            <Field label="Tuition">
              {(id) => (
                <Select id={id} value={tuitionId} onChange={(e) => setTuitionId(e.target.value)}>
                  {linkable.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subject} · {t.studentName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : (
            <FormError>Homework needs a student with an account. Link a student to a tuition first.</FormError>
          )
        ) : null}
        {noStudent ? <FormError>This tuition has no linked student account yet, so homework can’t be shared.</FormError> : null}
        <Field label="Chapter">{(id) => <Input id={id} value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Chapter 4" />}</Field>
        <Field label="Topic">{(id) => <Input id={id} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Motion numericals" />}</Field>
        <Field label="Due date">{(id) => <Input id={id} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
        <Field label="Instructions (optional)">
          {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Solve questions 1–12 and show the formula used." />}
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" loading={busy} disabled={!!noStudent || (!editing && !chosen)}>
          {editing ? 'Save changes' : 'Assign homework'}
        </Button>
      </form>
    </Sheet>
  );
}
