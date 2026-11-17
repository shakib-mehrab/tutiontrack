'use client';

import useSWR, { mutate } from 'swr';
import { fetcher, send } from './api';
import { noonISO } from './format';
import type {
  CommentDTO,
  HomeworkDTO,
  MonthRecordDTO,
  PaymentsResponse,
  TuitionDetailResponse,
  TuitionsResponse,
} from './types';

export function useTuitions() {
  return useSWR<TuitionsResponse>('/api/tuitions', fetcher);
}

export function useTuition(id: string | undefined) {
  return useSWR<TuitionDetailResponse>(id ? `/api/tuitions/${id}` : null, fetcher);
}

export function useMonths(id: string | undefined) {
  return useSWR<{ success: boolean; months: MonthRecordDTO[] }>(id ? `/api/tuitions/${id}/months` : null, fetcher);
}

export function usePayments() {
  return useSWR<PaymentsResponse>('/api/payments', fetcher);
}

export function useHomeworkList(tuitionId?: string) {
  return useSWR<HomeworkDTO[]>(tuitionId ? `/api/homework?tuitionId=${tuitionId}` : '/api/homework', fetcher);
}

export function useHomework(id: string | undefined) {
  return useSWR<HomeworkDTO>(id ? `/api/homework/${id}` : null, fetcher);
}

export function useComments(id: string | undefined) {
  return useSWR<CommentDTO[]>(id ? `/api/homework/${id}/comments` : null, fetcher, { refreshInterval: 15_000 });
}

/** Re-fetch every tuition/payment view after a change. */
export function refreshTuitions() {
  return mutate((key) => typeof key === 'string' && (key.startsWith('/api/tuitions') || key.startsWith('/api/payments')));
}

export function refreshHomework() {
  return mutate((key) => typeof key === 'string' && key.startsWith('/api/homework'));
}

/* ---------- Actions ---------- */

export async function logClass(tuitionId: string, day: string, note?: string) {
  const res = await send<{ success: boolean; message: string; logId?: string }>(`/api/tuitions/${tuitionId}/classes`, 'PATCH', {
    action: 'increment',
    classDate: noonISO(day),
    note: note || undefined,
  });
  await refreshTuitions();
  return res;
}

export async function removeClass(tuitionId: string, logId: string) {
  const res = await send(`/api/tuitions/${tuitionId}/logs/${logId}`, 'DELETE');
  await refreshTuitions();
  return res;
}

export async function setPaid(tuitionId: string, month: string, paid: boolean, amount?: number | null) {
  const res = await send(`/api/tuitions/${tuitionId}/payment`, 'POST', { month, paid, amount: amount ?? undefined });
  await refreshTuitions();
  return res;
}

export async function closeMonth(tuitionId: string) {
  const res = await send(`/api/tuitions/${tuitionId}/months`, 'POST');
  await refreshTuitions();
  return res;
}
