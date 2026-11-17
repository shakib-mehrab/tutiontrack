'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { ReportButton, SlipButton } from '@/components/documents';
import { Badge, Button, Card, EmptyState, Skeleton, cn } from '@/components/ui/core';
import { Chips } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/client/api';
import { formatMoney, monthLabel, toDate } from '@/lib/client/format';
import { setPaid, usePayments } from '@/lib/client/hooks';
import type { MonthRecordDTO, PaymentDTO, TuitionDTO } from '@/lib/client/types';

type Filter = 'all' | 'due' | 'paid';

type Row = {
  key: string;
  t: TuitionDTO;
  monthYear: string;
  monthId: string; // 'current' or record id
  taken: number;
  planned: number;
  payment: PaymentDTO | null | undefined;
  amount: number | null;
  open: boolean;
  record?: MonthRecordDTO;
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const isTeacher = session?.user.role === 'teacher';
  const { data, isLoading } = usePayments();
  const [filter, setFilter] = useState<Filter>('all');

  const rows: Row[] = (data?.items ?? []).flatMap(({ tuition: t, months }) => [
    {
      key: `${t.id}-current`,
      t,
      monthYear: t.currentMonthYear,
      monthId: 'current',
      taken: t.takenClasses,
      planned: t.plannedClassesPerMonth,
      payment: t.currentPayment,
      amount: t.currentPayment?.amount ?? t.feeAmount ?? null,
      open: true,
    },
    ...months.map((m) => ({
      key: `${t.id}-${m.id}`,
      t,
      monthYear: m.monthYear,
      monthId: m.id,
      taken: m.takenClasses,
      planned: m.plannedClasses,
      payment: m.payment,
      amount: m.payment?.amount ?? null,
      open: false,
      record: m,
    })),
  ]);

  const dueRows = rows.filter((r) => !r.open && !r.payment?.paid && r.amount != null);
  const dueTotal = dueRows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const year = new Date().getFullYear();
  const collected = rows.filter((r) => r.payment?.paid && toDate(r.payment.paidAt)?.getFullYear() === year).reduce((s, r) => s + (r.amount ?? 0), 0);

  const filtered = rows.filter((r) =>
    filter === 'all' ? r.amount != null || r.payment?.paid : filter === 'paid' ? r.payment?.paid : !r.payment?.paid && r.amount != null && !r.open
  );

  // Group: open months first (as "This month"), then closed months newest first.
  const groups = new Map<string, Row[]>();
  for (const r of [...filtered].sort((a, b) => Number(b.open) - Number(a.open) || b.monthYear.localeCompare(a.monthYear))) {
    const key = r.open ? 'open' : r.monthYear;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <>
      <PageHeader title={isTeacher ? 'Payments' : 'Fees'} />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-7 w-7" aria-hidden />} title="No tuitions yet">
          Fees show up here once a tuition has a monthly fee.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
            <div className="flex flex-col gap-1.5 rounded-[var(--radius-card)] bg-coral-soft p-4">
              <span className="text-xs font-bold text-coral-ink">Due</span>
              <span className="text-[22px] font-extrabold">{formatMoney(dueTotal)}</span>
              <span className="text-xs font-semibold text-coral-ink">
                {dueRows.length ? `${dueRows.length} closed ${dueRows.length === 1 ? 'month' : 'months'} unpaid` : 'All settled'}
              </span>
            </div>
            <Card className="flex flex-col gap-1.5 p-4">
              <span className="text-xs font-bold text-muted">{isTeacher ? 'Collected' : 'Paid'} in {year}</span>
              <span className="text-[22px] font-extrabold">{formatMoney(collected)}</span>
              <span className="text-xs font-semibold text-mint-ink">{rows.filter((r) => r.payment?.paid).length} paid months</span>
            </Card>
          </div>

          <Chips
            label="Filter payments"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'due', label: `Due${dueRows.length ? ` · ${dueRows.length}` : ''}` },
              { value: 'paid', label: 'Paid' },
            ]}
          />

          {groups.size === 0 ? <Card className="p-5 text-sm text-muted">Nothing here.</Card> : null}

          <div className="grid gap-6 xl:grid-cols-2">
            {Array.from(groups.entries()).map(([key, items]) => (
              <section key={key} className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[15px] font-extrabold">{key === 'open' ? 'This month' : monthLabel(key)}</h2>
                  {key === 'open' ? <Badge>Open months</Badge> : null}
                </div>
                <Card className="flex flex-col">
                  {items.map((r, i) => (
                    <PaymentRow key={r.key} r={r} isTeacher={isTeacher} last={i === items.length - 1} />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PaymentRow({ r, isTeacher, last }: { r: Row; isTeacher: boolean; last: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const paid = !!r.payment?.paid;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5', !last && 'border-b border-ground')}>
      <Link href={`/tuitions/${r.t.id}`} className="flex min-w-[150px] flex-1 flex-col gap-0.5 text-ink no-underline">
        <span className="truncate text-sm font-bold">
          {r.t.subject} · {isTeacher ? r.t.studentName ?? 'Student' : r.t.teacherName}
        </span>
        <span className="text-xs text-muted">
          {r.open ? `${monthLabel(r.monthYear, true)} · ${r.taken} of ${r.planned} so far` : `${r.taken} of ${r.planned} classes`}
        </span>
      </Link>
      <span className="text-sm font-bold">{formatMoney(r.amount)}</span>
      {paid ? <Badge tone="mint">Paid</Badge> : r.open ? <Badge>Running</Badge> : r.amount != null ? <Badge tone="coral">Due</Badge> : <Badge tone="neutral">No fee</Badge>}
      <div className="flex items-center gap-2">
        {paid && r.payment ? <SlipButton tuition={r.t} monthYear={r.monthYear} taken={r.taken} planned={r.planned} payment={r.payment} /> : null}
        {isTeacher && !paid && r.amount != null ? (
          <Button
            variant="dark"
            size="sm"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await setPaid(r.t.id, r.monthId, true);
                toast({ message: `${monthLabel(r.monthYear)} fee marked as paid` });
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
        {r.record ? <ReportButton tuition={r.t} record={r.record} iconOnly /> : null}
      </div>
    </div>
  );
}
