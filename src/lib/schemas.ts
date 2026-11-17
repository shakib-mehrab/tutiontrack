import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm');
const weekdays = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'Pick at least one class day')
  .max(7)
  .transform((days) => Array.from(new Set(days)).sort((a, b) => a - b));
const fee = z.coerce.number().int().min(0).max(10_000_000).nullable().optional();

export const createTuitionSchema = z
  .object({
    studentEmail: z.string().trim().email('Invalid student email').optional().or(z.literal('')),
    studentName: z.string().trim().max(100).optional(),
    subject: z.string().trim().min(1, 'Subject is required').max(100),
    startTime: time,
    endTime: time,
    weekdays,
    plannedClassesPerMonth: z.coerce.number().int().min(1).max(62),
    feeAmount: fee,
  })
  .refine((v) => v.endTime > v.startTime, { message: 'End time must be after start time', path: ['endTime'] });

export const updateTuitionSchema = z
  .object({
    studentName: z.string().trim().min(1).max(100),
    subject: z.string().trim().min(1).max(100),
    startTime: time,
    endTime: time,
    weekdays,
    plannedClassesPerMonth: z.coerce.number().int().min(1).max(62),
    feeAmount: fee,
  })
  .partial()
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const paymentSchema = z.object({
  month: z.string().min(1).max(100), // 'current' or a closed month's id
  paid: z.boolean(),
  amount: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}
