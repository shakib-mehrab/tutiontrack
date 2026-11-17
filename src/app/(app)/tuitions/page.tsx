'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { TuitionCard } from '@/components/tuition';
import { ButtonLink, EmptyState, Skeleton } from '@/components/ui/core';
import { Input } from '@/components/ui/form';
import { useTuitions } from '@/lib/client/hooks';

export default function TuitionsPage() {
  const { data: session } = useSession();
  const role = session?.user.role ?? 'teacher';
  const { data, isLoading } = useTuitions();
  const [q, setQ] = useState('');

  const list = (data?.tuitions ?? []).filter((t) => {
    const s = q.trim().toLowerCase();
    return !s || [t.subject, t.studentName, t.teacherName].some((x) => x?.toLowerCase().includes(s));
  });

  return (
    <>
      <PageHeader
        title={role === 'teacher' ? 'Tuitions' : 'My classes'}
        eyebrow={data ? `${data.tuitions.length} ${data.tuitions.length === 1 ? 'tuition' : 'tuitions'}` : undefined}
        actions={
          role === 'teacher' ? (
            <ButtonLink href="/tuitions/new">
              <Plus className="h-[18px] w-[18px]" aria-hidden />
              New tuition
            </ButtonLink>
          ) : null
        }
      />

      {(data?.tuitions.length ?? 0) > 4 ? (
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search tuitions" placeholder="Search subject or student" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" aria-hidden />}
          title={q ? 'No matches' : role === 'teacher' ? 'No tuitions yet' : 'No classes yet'}
          action={
            role === 'teacher' && !q ? (
              <ButtonLink href="/tuitions/new" size="lg">
                <Plus className="h-5 w-5" aria-hidden />
                New tuition
              </ButtonLink>
            ) : null
          }
        >
          {q ? 'Try a different name or subject.' : role === 'teacher' ? 'Add a tuition to start counting classes.' : 'Your teacher adds you using your email.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((t) => (
            <TuitionCard key={t.id} t={t} role={role} />
          ))}
        </div>
      )}
    </>
  );
}
