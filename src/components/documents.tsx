'use client';

import { useState, useSyncExternalStore } from 'react';
import { Download, FileText, Receipt, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/core';
import { useToast } from '@/components/ui/toast';
import { errorMessage, fetcher } from '@/lib/client/api';
import { monthLabel } from '@/lib/client/format';
import { buildReport, buildSlip, canShareFiles, downloadPdf, shareOrDownload, slugify } from '@/lib/client/pdf';
import type { ClassLogDTO, MonthRecordDTO, PaymentDTO, TuitionDTO } from '@/lib/client/types';

const noSubscribe = () => () => {};

/** Whether the system share sheet can take files (false during server render). */
function useCanShare() {
  return useSyncExternalStore(noSubscribe, canShareFiles, () => false);
}

type Size = 'sm' | 'md';

/** Monthly report PDF for the open month (pass `classes`) or a closed month (pass `record`). */
export function ReportButton({
  tuition,
  record,
  classes,
  size = 'md',
  label = 'Report PDF',
  iconOnly,
}: {
  tuition: TuitionDTO;
  record?: MonthRecordDTO;
  classes?: ClassLogDTO[];
  size?: Size;
  label?: string;
  iconOnly?: boolean;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      let list = classes;
      if (!list) {
        const res = await fetcher<{ logs: ClassLogDTO[] }>(`/api/tuitions/${tuition.id}/logs?cycle=${encodeURIComponent(record!.id)}`);
        list = res.logs.filter((l) => l.actionType === 'increment');
      }
      const monthYear = record?.monthYear ?? tuition.currentMonthYear;
      const doc = await buildReport({
        tuition,
        monthYear,
        planned: record?.plannedClasses ?? tuition.plannedClassesPerMonth,
        taken: record?.takenClasses ?? tuition.takenClasses,
        classes: list,
        payment: record ? record.payment : tuition.currentPayment,
        closed: !!record,
      });
      downloadPdf(doc, `${slugify(`${tuition.subject}-${tuition.studentName ?? 'student'}-${monthYear}`)}-report.pdf`);
    } catch (e) {
      toast({ message: errorMessage(e, 'Could not create the report'), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (iconOnly) {
    return (
      <Button variant="soft" size="icon-sm" onClick={run} loading={busy} aria-label={`Download ${monthLabel(record?.monthYear ?? tuition.currentMonthYear)} report`}>
        {!busy ? <Download className="h-4 w-4" aria-hidden /> : null}
      </Button>
    );
  }
  return (
    <Button variant="outline" size={size} onClick={run} loading={busy}>
      {!busy ? <FileText className="h-[18px] w-[18px]" aria-hidden /> : null}
      {label}
    </Button>
  );
}

/** Payment slip: shares through the phone's share sheet when possible, else downloads. */
export function SlipButton({
  tuition,
  monthYear,
  taken,
  planned,
  payment,
  size = 'sm',
  variant = 'soft',
}: {
  tuition: TuitionDTO;
  monthYear: string;
  taken: number;
  planned: number;
  payment: PaymentDTO;
  size?: Size;
  variant?: 'soft' | 'outline';
}) {
  const toast = useToast();
  const canShare = useCanShare();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const doc = await buildSlip({ tuition, monthYear, taken, planned, payment });
      const name = `payment-slip-${slugify(`${tuition.subject}-${tuition.studentName ?? ''}-${monthYear}`)}.pdf`;
      const result = await shareOrDownload(doc, name, `Payment slip · ${tuition.subject} · ${monthLabel(monthYear)}`);
      if (result === 'downloaded') toast({ message: 'Payment slip downloaded' });
    } catch (e) {
      toast({ message: errorMessage(e, 'Could not create the slip'), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={run} loading={busy}>
      {!busy ? canShare ? <Share2 className="h-4 w-4" aria-hidden /> : <Receipt className="h-4 w-4" aria-hidden /> : null}
      {canShare ? 'Share slip' : 'Payment slip'}
    </Button>
  );
}
