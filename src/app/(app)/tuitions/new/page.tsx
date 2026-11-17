'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { TuitionForm, formToPayload } from '@/components/tuition';
import { Card, buttonClass } from '@/components/ui/core';
import { useToast } from '@/components/ui/toast';
import { send } from '@/lib/client/api';
import { refreshTuitions } from '@/lib/client/hooks';

export default function NewTuitionPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="New tuition"
        back={
          <Link href="/tuitions" aria-label="Back" className={buttonClass('outline', 'icon', 'border-0 bg-surface')}>
            <ChevronLeft className="h-5 w-5 text-ink" aria-hidden />
          </Link>
        }
      />
      <Card className="rounded-[var(--radius-panel)] p-[18px] sm:p-6">
        <TuitionForm
          mode="create"
          submitLabel="Create tuition"
          onSubmit={async (v) => {
            const res = await send<{ tuitionId?: string }>('/api/tuitions', 'POST', formToPayload(v));
            await refreshTuitions();
            toast({ message: 'Tuition created' });
            router.replace(res.tuitionId ? `/tuitions/${res.tuitionId}` : '/tuitions');
          }}
        />
      </Card>
    </div>
  );
}
