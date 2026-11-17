'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { HomeworkRow, HomeworkSheet } from '@/components/homework';
import { Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui/core';
import { Chips } from '@/components/ui/form';
import { toDate } from '@/lib/client/format';
import { useHomeworkList, useTuitions } from '@/lib/client/hooks';

type Filter = 'open' | 'done' | 'all';

export default function HomeworkPage() {
  const { data: session } = useSession();
  const isTeacher = session?.user.role === 'teacher';
  const { data, isLoading } = useHomeworkList();
  const { data: tuitions } = useTuitions();
  const [filter, setFilter] = useState<Filter>('open');
  const [assigning, setAssigning] = useState(false);

  const all = data ?? [];
  const open = all
    .filter((h) => h.status === 'assigned')
    .sort((a, b) => (toDate(a.dueDate)?.getTime() ?? 0) - (toDate(b.dueDate)?.getTime() ?? 0));
  const done = all.filter((h) => h.status === 'completed');
  const shown = filter === 'open' ? open : filter === 'done' ? done : all;

  return (
    <>
      <PageHeader
        title="Homework"
        eyebrow={data ? `${open.length} open · ${done.length} completed` : undefined}
        actions={
          isTeacher ? (
            <Button onClick={() => setAssigning(true)}>
              <Plus className="h-[18px] w-[18px]" aria-hidden />
              Assign
            </Button>
          ) : null
        }
      />
      <div className="mb-5">
        <Chips
          label="Filter homework"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: `Open${open.length ? ` · ${open.length}` : ''}` },
            { value: 'done', label: 'Completed' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-7 w-7" aria-hidden />} title={filter === 'open' ? 'Nothing open' : 'No homework here'}>
          {isTeacher ? 'Assign homework to a student from here or from a tuition page.' : 'When your teacher assigns homework, it shows up here.'}
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groupBySubject(shown, isTeacher).map(([subject, items]) => (
            <section key={subject} className="flex flex-col gap-2.5">
              <SectionTitle>{subject}</SectionTitle>
              <Card className="flex flex-col gap-2 p-2.5">
                {items.map((h) => (
                  <HomeworkRow key={h.id} h={h} showSubject={false} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      {assigning ? <HomeworkSheet open tuitions={tuitions?.tuitions ?? []} onClose={() => setAssigning(false)} /> : null}
    </>
  );
}

function groupBySubject<T extends { subject: string; studentName?: string }>(items: T[], withStudent: boolean): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const h of items) {
    const key = withStudent && h.studentName ? `${h.subject} · ${h.studentName}` : h.subject;
    map.set(key, [...(map.get(key) ?? []), h]);
  }
  return Array.from(map.entries());
}
