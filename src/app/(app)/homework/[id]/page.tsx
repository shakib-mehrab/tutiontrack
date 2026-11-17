'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, ChevronLeft, Pencil, RotateCcw, SendHorizontal, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { HomeworkSheet, HomeworkStatus } from '@/components/homework';
import { Badge, Button, Card, EmptyState, Skeleton, buttonClass, cn } from '@/components/ui/core';
import { ConfirmSheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { errorMessage, send } from '@/lib/client/api';
import { formatClock, formatDate, formatDay, toDate } from '@/lib/client/format';
import { refreshHomework, useComments, useHomework } from '@/lib/client/hooks';

export default function HomeworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const { data: h, isLoading, error, mutate } = useHomework(id);
  const { data: comments, mutate: mutateComments } = useComments(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [comments?.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (error || !h) {
    return (
      <EmptyState title="Homework not found" action={<Link href="/homework" className={buttonClass('outline')}>Back to homework</Link>}>
        It may have been deleted.
      </EmptyState>
    );
  }

  const isTeacher = session?.user.id === h.teacherId;
  const completed = h.status === 'completed';

  const setStatus = async (status: 'completed' | 'assigned') => {
    setBusy(true);
    try {
      await send(`/api/homework/${h.id}`, 'PUT', { status });
      await Promise.all([mutate(), refreshHomework()]);
      toast({ message: status === 'completed' ? 'Marked complete' : 'Reopened' });
    } catch (e) {
      toast({ message: errorMessage(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const post = async (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage('');
    try {
      await send(`/api/homework/${h.id}/comments`, 'POST', { comment: text });
      await mutateComments();
    } catch (err) {
      setMessage(text);
      toast({ message: errorMessage(err), tone: 'error' });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <PageHeader
        title="Homework"
        back={
          <Link href="/homework" aria-label="Back" className={buttonClass('outline', 'icon', 'border-0 bg-surface')}>
            <ChevronLeft className="h-5 w-5 text-ink" aria-hidden />
          </Link>
        }
      />

      <Card className="flex flex-col gap-3 rounded-[var(--radius-panel)] p-[18px] sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge>{h.subject}</Badge>
          <HomeworkStatus h={h} />
          {!completed ? <Badge tone="neutral">Due {formatDay(toDate(h.dueDate))}</Badge> : null}
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">
          {h.chapter} · {h.topic}
        </h2>
        {h.notes ? <p className="text-sm leading-relaxed whitespace-pre-line text-body">{h.notes}</p> : null}
        <p className="text-xs text-muted">
          {isTeacher ? `For ${h.studentName}` : `From ${h.teacherName}`} · assigned {formatDate(toDate(h.createdAt))}
        </p>
        {isTeacher ? (
          <div className="flex items-center gap-2.5 pt-1">
            {completed ? (
              <Button variant="outline" className="flex-1" onClick={() => setStatus('assigned')} loading={busy}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reopen
              </Button>
            ) : (
              <Button className="h-[46px] flex-1" onClick={() => setStatus('completed')} loading={busy}>
                <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
                Mark complete
              </Button>
            )}
            <Button variant="outline" size="icon" aria-label="Edit homework" onClick={() => setEditing(true)}>
              <Pencil className="h-[18px] w-[18px]" aria-hidden />
            </Button>
            <Button variant="outline" size="icon" aria-label="Delete homework" onClick={() => setDeleting(true)}>
              <Trash2 className="h-[18px] w-[18px]" aria-hidden />
            </Button>
          </div>
        ) : null}
      </Card>

      <h2 className="mt-6 mb-3 text-[15px] font-extrabold">Discussion</h2>
      <div className="flex flex-col gap-2.5 pb-28 lg:pb-4">
        {(comments ?? []).length === 0 ? <p className="text-sm text-muted">No messages yet. Ask a question or leave a note.</p> : null}
        {(comments ?? []).map((c) => {
          const mine = c.userId === session?.user.id;
          const at = toDate(c.createdAt);
          return (
            <div key={c.id} className={cn('flex max-w-[78%] flex-col gap-1', mine ? 'items-end self-end' : 'self-start')}>
              <div
                className={cn(
                  'px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line',
                  mine ? 'rounded-[18px_18px_6px_18px] bg-primary text-white' : 'rounded-[18px_18px_18px_6px] bg-surface shadow-[0_4px_12px_rgba(48,56,140,0.06)]'
                )}
              >
                {c.comment}
              </div>
              <span className="text-[11px] text-muted">
                {mine ? 'You' : c.userName} · {formatDay(at)}, {formatClock(at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={post}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 rounded-t-3xl bg-surface px-4 pt-3 shadow-[var(--shadow-bar)] lg:static lg:mt-2 lg:rounded-[var(--radius-card)] lg:p-3"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <label className="flex flex-1">
          <span className="sr-only">Write a message</span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message…"
            maxLength={1000}
            className="h-12 flex-1 rounded-[14px] border-[1.5px] border-line bg-mist px-3.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <Button type="submit" size="icon" className="h-12 w-12" aria-label="Send" disabled={!message.trim()}>
          <SendHorizontal className="h-5 w-5" aria-hidden />
        </Button>
      </form>

      {editing ? <HomeworkSheet open editing={h} onClose={() => setEditing(false)} onSaved={() => mutate()} /> : null}
      <ConfirmSheet
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this homework?"
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await send(`/api/homework/${h.id}`, 'DELETE');
            await refreshHomework();
            toast({ message: 'Homework deleted' });
            router.replace('/homework');
          } catch (e) {
            toast({ message: errorMessage(e), tone: 'error' });
            setBusy(false);
          }
        }}
      >
        The homework and its discussion will be removed for you and the student.
      </ConfirmSheet>
    </div>
  );
}
